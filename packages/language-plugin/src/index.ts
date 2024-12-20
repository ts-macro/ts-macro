/// <reference types="@volar/typescript" />

import { createFilter } from '@rollup/pluginutils'
import { forEachEmbeddedCode, type LanguagePlugin } from '@volar/language-core'
import { createJiti } from 'jiti'
import {
  TsmVirtualCode,
  type Options,
  type Plugin,
  type TsmLanguagePlugin,
} from 'ts-macro'
import { getPluginsFromVite } from './config'
import type { URI } from 'vscode-uri'

export * from './config'

const jiti = createJiti(import.meta.url)

export const getLanguagePlugins = (
  ts: typeof import('typescript'),
  compilerOptions: import('typescript').CompilerOptions,
): LanguagePlugin<string | URI>[] => {
  let options: Options | undefined
  const plugins: Plugin[] = []
  const currentDirectory = ts.sys.getCurrentDirectory()
  try {
    options = jiti(`${currentDirectory}/tsm.config`).default
    const vitePlugins = getPluginsFromVite(currentDirectory, ts)
    if (vitePlugins) {
      plugins.push(...vitePlugins)
    }
    plugins.push(...(options?.plugins ?? []))
  } catch {}

  const resolvedPlugins = resolvePlugins(
    plugins.flatMap((plugin) => {
      if (typeof plugin === 'function') {
        try {
          return plugin({
            ts,
            compilerOptions,
          })
        } catch {}
      } else {
        return plugin
      }
    }),
  )
  if (!resolvedPlugins.length) return []

  const filter = createFilter(
    options?.include,
    options?.exclude ?? [/\/tsm\.config\.*$/, /root_tsx?\.tsx?$/],
    { resolve: currentDirectory },
  )

  return [
    {
      getLanguageId() {
        return undefined
      },
      createVirtualCode(uri, rawLanguageId, snapshot) {
        const filePath = typeof uri === 'string' ? uri : uri.path
        if (
          ['typescript', 'typescriptreact'].includes(rawLanguageId) &&
          filter(filePath)
        ) {
          const languageId = rawLanguageId === 'typescript' ? 'ts' : 'tsx'
          const ast = ts.createSourceFile(
            `index.${languageId}`,
            snapshot.getText(0, snapshot.getLength()).toString(),
            99 satisfies typeof ts.ScriptTarget.Latest,
          )
          return new TsmVirtualCode(filePath, ast, languageId, resolvedPlugins)
        }
      },
      typescript: {
        extraFileExtensions: [],
        getServiceScript(root) {
          for (const code of forEachEmbeddedCode(root)) {
            if (code.id === `root_${code.languageId}`) {
              return {
                code,
                extension: `.${code.languageId}`,
                scriptKind: code.languageId === 'tsx' ? 4 : 3,
              }
            }
          }
        },
      },
    },
  ]
}

function resolvePlugins(
  plugins: (TsmLanguagePlugin | undefined)[],
): TsmLanguagePlugin[] {
  const prePlugins: TsmLanguagePlugin[] = []
  const postPlugins: TsmLanguagePlugin[] = []
  const normalPlugins: TsmLanguagePlugin[] = []

  if (plugins) {
    plugins.flat().forEach((p) => {
      if (!p) return
      if (p.enforce === 'pre') prePlugins.push(p)
      else if (p.enforce === 'post') postPlugins.push(p)
      else normalPlugins.push(p)
    })
  }
  const result = [...prePlugins, ...normalPlugins, ...postPlugins]

  // unique
  const map = new Map()
  for (const [index, plugin] of result.entries()) {
    map.set(plugin.name || `plugin-${index}`, plugin)
  }
  return [...map.values()]
}
