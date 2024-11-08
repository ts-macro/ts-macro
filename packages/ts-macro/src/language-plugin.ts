/// <reference types="@volar/typescript" />

import { forEachEmbeddedCode, type LanguagePlugin } from '@volar/language-core'
import { createJiti } from 'jiti'
import { TsmVirtualCode } from './virtual-code'
import type { Options, TsmLanguagePlugin } from './types'
import type { URI } from 'vscode-uri'

const jiti = createJiti(import.meta.url)

export const getLanguagePlugin = (
  ts: typeof import('typescript'),
  configDir: string,
  compilerOptions: import('typescript').CompilerOptions,
): LanguagePlugin<URI> => {
  let options: Options | undefined
  if (configDir) {
    try {
      options = jiti(`${configDir}/tsm.config`).default
    } catch (error) {
      console.error(error)
    }
  }

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

  return {
    getLanguageId() {
      return undefined
    },
    createVirtualCode(uri, rawLanguageId, snapshot) {
      if (['typescript', 'typescriptreact'].includes(rawLanguageId)) {
        // @ts-expect-error maybe a string
        const fileName = uri.path || (uri as string)
        const languageId = rawLanguageId === 'typescript' ? 'ts' : 'tsx'
        const rawText = snapshot.getText(0, snapshot.getLength()).toString()
        const ast = ts.createSourceFile(
          `index.${languageId}`,
          rawText,
          ts.ScriptTarget.Latest,
        )
        return new TsmVirtualCode(fileName, rawText, ast, languageId, plugins)
      }
    },
    typescript: {
      extraFileExtensions: [],
      getServiceScript(root) {
        for (const code of forEachEmbeddedCode(root)) {
          if (code.id === 'root') {
            return {
              fileName: `${code.id}.${code.languageId}`,
              code,
              extension: `.${code.languageId}`,
              scriptKind: code.languageId === 'tsx' ? 4 : 3,
            }
          }
        }
      },
    },
  }
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
