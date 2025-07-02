import { createJiti } from 'jiti'
import { getPluginsFromVite } from './config'
import type { Options as _Options, Plugin } from 'ts-macro'

export const jiti = createJiti(import.meta.url)

export type Options = ReturnType<typeof getOptions>

export { getPluginsFromVite }

export function getOptions(
  ts: typeof import('typescript'),
  pluginCache: string[] = [],
) {
  let options: _Options | undefined
  const plugins: Plugin[] = []
  const currentDirectory = ts.sys.getCurrentDirectory()
  try {
    options =
      jiti(`${currentDirectory}/ts-macro.config`).default ||
      jiti(`${currentDirectory}/tsm.config`).default
  } catch (error: any) {
    if (
      error.code !== 'MODULE_NOT_FOUND' ||
      (!error.message.includes(`ts-macro.config'`) &&
        !error.message.includes(`tsm.config'`))
    ) {
      console.error(error)
    }
  }

  const vitePlugins = getPluginsFromVite(ts, pluginCache)
  if (vitePlugins) {
    plugins.push(...vitePlugins)
  }
  plugins.push(...(options?.plugins ?? []))

  return {
    ...options,
    plugins,
  }
}
