import type { TsmVirtualCode } from './virtual-code'
import type { VueCompilerOptions } from '@vue/language-core'

export type Options = {
  plugins: Plugin[]
}

export type Plugin = FactoryReturn | TsmLanguagePlugin | TsmLanguagePlugin[]

export type TsmLanguagePlugin = {
  name?: string
  enforce?: 'pre' | 'post'
  resolveVirtualCode?: (virtualCode: TsmVirtualCode) => void
}

export type Context<UserOptions = any> = {
  ts: typeof import('typescript')
  compilerOptions: import('typescript').CompilerOptions
  vueCompilerOptions?: VueCompilerOptions & Record<string, UserOptions>
}

export type Factory<UserOptions, Nested extends boolean = boolean> = (
  context: Context<UserOptions>,
  userOptions: UserOptions,
) => Nested extends true ? Array<TsmLanguagePlugin> : TsmLanguagePlugin
export type FactoryReturn<Nested extends boolean = boolean> = (
  context: Context,
) => Nested extends true ? Array<TsmLanguagePlugin> : TsmLanguagePlugin
export type PluginReturn<UserOptions, Nested extends boolean = boolean> = (
  ...args: undefined extends UserOptions ? [UserOptions] | [] : [UserOptions]
) => FactoryReturn<Nested>
