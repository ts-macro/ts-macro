import { createJiti } from 'jiti'
import { getPluginsFromVite } from './config'
import type { Options as _Options, Plugin } from 'ts-macro'

export const jiti = createJiti(import.meta.url)

export type Options = ReturnType<typeof getOptions>

export function getOptions(ts: typeof import('typescript')) {
  let options: _Options | undefined
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

  return {
    ...options,
    plugins,
  }
}
