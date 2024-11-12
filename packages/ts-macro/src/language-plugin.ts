/// <reference types="@volar/typescript" />

import { createFilter } from '@rollup/pluginutils'
import { forEachEmbeddedCode, type LanguagePlugin } from '@volar/language-core'
import { createJiti } from 'jiti'
import { TsmVirtualCode } from './virtual-code'
import type { Options, TsmLanguagePlugin } from './types'
import type { URI } from 'vscode-uri'

const jiti = createJiti(import.meta.url)

export const getLanguagePlugins = (
  ts: typeof import('typescript'),
  compilerOptions: import('typescript').CompilerOptions,
): LanguagePlugin<string | URI>[] => {
  let options: Options | undefined
  try {
    options = jiti(`${ts.sys.getCurrentDirectory()}/tsm.config`).default
  } catch {}
  if (!options) return []

  const filter = createFilter(
    options.include,
    options.exclude ?? [/\/tsm\.config\.*$/, /root_tsx?\.tsx?$/],
  )

  const plugins = sortPlugins(
    (options?.plugins ?? []).flatMap((plugin) => {
      if (typeof plugin === 'function') {
        return plugin({
          ts,
          compilerOptions,
        })
      } else {
        return plugin
      }
    }),
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
          return new TsmVirtualCode(filePath, ast, languageId, plugins)
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

function sortPlugins(plugins: TsmLanguagePlugin[]): TsmLanguagePlugin[] {
  const prePlugins: TsmLanguagePlugin[] = []
  const postPlugins: TsmLanguagePlugin[] = []
  const normalPlugins: TsmLanguagePlugin[] = []

  if (plugins) {
    plugins.flat().forEach((p) => {
      if (p.enforce === 'pre') prePlugins.push(p)
      else if (p.enforce === 'post') postPlugins.push(p)
      else normalPlugins.push(p)
    })
  }

  return [...prePlugins, ...normalPlugins, ...postPlugins]
}
