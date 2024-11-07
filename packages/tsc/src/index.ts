import { runTsc } from '@volar/typescript/lib/quickstart/runTsc'
import { getLanguagePlugin } from 'ts-macro'
import type { LanguagePlugin } from '@volar/language-core'

export function run() {
  const tscSdk = require.resolve('typescript/lib/tsc')
  const main = () => {
    runTsc(tscSdk, ['.ts', '.tsx'], (ts, runTscOptions) => {
      const languagePlugins: LanguagePlugin[] = []

      languagePlugins.push(
        getLanguagePlugin(
          ts,
          ts.sys.getCurrentDirectory(),
          runTscOptions.options,
        ),
      )

      return {
        languagePlugins,
      }
    })
  }

  try {
    main()
  } catch (error) {
    console.error('[tsmc]', error)
  }
}
