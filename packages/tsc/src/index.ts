import { getLanguagePlugins } from '@ts-macro/language-plugin'
import { getOptions } from '@ts-macro/language-plugin/options'
import { runTsc } from '@volar/typescript/lib/quickstart/runTsc'

export function run() {
  const main = () => {
    runTsc(
      require.resolve('typescript/lib/tsc'),
      {
        extraSupportedExtensions: ['.ts', '.tsx'],
        extraExtensionsToRemove: [],
      },
      (ts, runTscOptions) => {
        return {
          languagePlugins: getLanguagePlugins(
            ts,
            runTscOptions.options,
            getOptions(ts),
          ),
        }
      },
      `require('typescript')`,
    )
  }

  try {
    main()
  } catch (error) {
    console.error('[tsmc]', error)
  }
}
