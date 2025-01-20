import { getLanguagePlugins } from '@ts-macro/language-plugin'
import { getOptions } from '@ts-macro/language-plugin/options'
import { createLanguageServicePlugin } from '@volar/typescript/lib/quickstart/createLanguageServicePlugin'

const plugin = createLanguageServicePlugin((ts, info) => {
  ts.sys.getCurrentDirectory = () =>
    info.languageServiceHost.getCurrentDirectory()
  return {
    languagePlugins: getLanguagePlugins(
      ts,
      info.languageServiceHost.getCompilationSettings(),
      getOptions(ts),
    ),
  }
})

export = plugin
