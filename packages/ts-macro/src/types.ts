import type { TsmVirtualCode } from './virtual-code'
import type { CodeInformation } from '@volar/language-core'
import type { Segment } from 'muggle-string'

export type Code = Segment<CodeInformation>

export type Options = {
  plugins: Plugin[]
}

export type Plugin = FactoryReturn | TsmLanguagePlugin | TsmLanguagePlugin[]

export type TsmLanguagePlugin = {
  name?: string
  enforce?: 'pre' | 'post'
  resolveVirtualCode?: (virtualCode: TsmVirtualCode) => void
}

export type Context = {
  ts: typeof import('typescript')
  sys: import('typescript').System
  compilerOptions: import('typescript').CompilerOptions
}

export type Factory<UserOptions, Nested extends boolean = boolean> = (
  options: { options: UserOptions } & Context,
) => Nested extends true ? Array<TsmLanguagePlugin> : TsmLanguagePlugin
export type FactoryReturn<Nested extends boolean = boolean> = (
  context: Context,
) => Nested extends true ? Array<TsmLanguagePlugin> : TsmLanguagePlugin
export type PluginReturn<UserOptions, Nested extends boolean = boolean> = (
  ...args: undefined extends UserOptions ? [UserOptions] | [] : [UserOptions]
) => FactoryReturn<Nested>
