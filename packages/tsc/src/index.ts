import { getLanguagePlugins } from '@ts-macro/language-plugin'
import { runTsc } from '@volar/typescript/lib/quickstart/runTsc'

export function run() {
  const tscSdk = require.resolve('typescript/lib/tsc')
  const main = () => {
    runTsc(
      tscSdk,
      {
        extraSupportedExtensions: ['.ts', '.tsx'],
        extraExtensionsToRemove: [],
      },
      (ts, runTscOptions) => {
        return {
          languagePlugins: getLanguagePlugins(ts, runTscOptions.options),
        }
      },
    )
  }

  try {
    main()
  } catch (error) {
    console.error('[tsmc]', error)
  }
}
