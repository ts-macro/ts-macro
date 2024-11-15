import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { parseModule, type ProxifiedModule } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'

const require = createRequire(import.meta.url)

export function loadFile<Exports extends object = any>(
  filename: string,
): ProxifiedModule<Exports> {
  const contents = readFileSync(filename, 'utf8')
  return parseModule(contents, { sourceFileName: filename })
}

export function getPluginsFromVite(configDir: string) {
  try {
    const filename = `${configDir}/vite.config.ts`
    if (!existsSync(filename)) return

    const config = loadFile(filename)

    const plugins = [...(getDefaultExportOptions(config).plugins ?? [])]
      .map((plugin: any) => {
        const item = config.imports.$items.find(
          (i) => i.local === plugin.$callee,
        )
        if (!item) return
        for (const path of [
          `${item.from}/volar`,
          // unplugin
          `${item.from?.split('/').slice(0, -1).join('/')}/volar`,
        ]) {
          try {
            const from = require.resolve(path, {
              paths: [configDir],
            })
            return require(from)(
              eval(
                `(${config.$code.slice(
                  plugin.$args[0].$ast.start,
                  plugin.$args[0].$ast.end,
                )})`,
              ),
            )
          } catch {}
        }
      })
      .filter(Boolean)
    return plugins
  } catch {}
}
