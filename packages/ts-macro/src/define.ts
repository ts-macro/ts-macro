import type { Factory, Options, PluginReturn } from './types'
import type { Sfc, VueEmbeddedCode } from '@vue/language-core'

export function defineConfig(config: Options) {
  return config
}

export function createPlugin<UserOptions, Nested extends boolean = boolean>(
  factory: Factory<UserOptions, Nested>,
): PluginReturn<UserOptions, Nested>
export function createPlugin(factory: any) {
  return (options: any) => {
    // compatible with @vue/language-tools
    if (options?.modules) {
      const result: any = factory({
        ts: options.modules.typescript,
        ...options,
      })
      if (result.resolveVirtualCode) {
        result.resolveEmbeddedCode = (
          fileName: string,
          sfc: Sfc,
          embeddedFile: VueEmbeddedCode,
        ) => {
          for (const source of ['script', 'scriptSetup'] as const) {
            const ast = sfc[source]?.ast
            if (!ast) continue
            result.resolveVirtualCode({
              ast,
              source,
              fileName,
              id: embeddedFile.id,
              codes: embeddedFile.content,
              languageId: embeddedFile.lang,
              embeddedCodes: embeddedFile.embeddedCodes,
              linkedCodeMappings: embeddedFile.linkedCodeMappings,
            })
          }
        }
        result.order =
          result.enforce === 'pre' ? -1 : result.enforce === 'post' ? 1 : 0
        result.version ??= 2.1
        return result
      }
    }
    return (context: any) => factory(context, options)
  }
}
