import { getLanguagePlugins } from '@ts-macro/language-plugin'
import {
  getOptions,
  getPluginsFromVite,
} from '@ts-macro/language-plugin/options'
import { createLanguageServicePlugin } from '@volar/typescript/lib/quickstart/createLanguageServicePlugin'

const plugin = createLanguageServicePlugin((ts, info) => {
  ts.sys.getCurrentDirectory = () =>
    info.languageServiceHost.getCurrentDirectory()

  const pluginCache: string[] = []
  const options = getOptions(ts, pluginCache)
  if (
    info.session &&
    !(info.session as any).handlers.has('_tsm:getPluginsFromVite')
  ) {
    info.session.addProtocolHandler('_tsm:getPluginsFromVite', () => {
      const newPluginCache: string[] = []
      getPluginsFromVite(ts, newPluginCache)
      return { response: pluginCache.join('') !== newPluginCache.join('') }
    })
  }

  return {
    languagePlugins: getLanguagePlugins(
      ts,
      info.languageServiceHost.getCompilationSettings(),
      options,
    ),
  }
})

export = plugin
