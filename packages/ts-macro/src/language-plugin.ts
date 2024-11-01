/// <reference types="@volar/typescript" />

import { forEachEmbeddedCode, type LanguagePlugin } from '@volar/language-core'
import { createJiti } from 'jiti'
import { TsmVirtualCode } from './virtual-code'
import type { Options } from './types'
import type { URI } from 'vscode-uri'

const jiti = createJiti(import.meta.url)

export const getLanguagePlugin = (
  ts: typeof import('typescript'),
  configDir?: any,
): LanguagePlugin<URI> => {
  let options: Options | undefined
  if (configDir) {
    try {
      options = jiti(`${configDir}/tsm.config`).default
    } catch (error) {
      console.error(error)
    }
  }

  return {
    getLanguageId() {
      return undefined
    },
    createVirtualCode(uri, languageId, snapshot) {
      if (['typescript', 'typescriptreact'].includes(languageId)) {
        return new TsmVirtualCode(
          uri.path,
          snapshot,
          ts,
          languageId === 'typescript' ? 'ts' : 'tsx',
          options,
        )
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
