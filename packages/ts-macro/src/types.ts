import type { TsmVirtualCode } from './virtual-code'
import type { CodeInformation, VirtualCode } from '@volar/language-core'
import type { Segment } from 'muggle-string'

type FilterPattern = Array<string | RegExp> | string | RegExp | null

export type Options = {
  exclude?: FilterPattern
  include?: FilterPattern
  plugins?: Plugin[]
}

export type Plugin = FactoryReturn | TsmLanguagePlugin | TsmLanguagePlugin[]

export type TsmLanguagePlugin = {
  name: string
  enforce?: 'pre' | 'post'
  resolveVirtualCode?: (virtualCode: TsmVirtualCode) => void
}

export type Context = {
  ts: typeof import('typescript')
  compilerOptions: import('typescript').CompilerOptions
  vueCompilerOptions?: any
}

export type Factory<UserOptions, Nested extends boolean = boolean> = (
  context: Context,
  userOptions: UserOptions,
) => Nested extends true ? Array<TsmLanguagePlugin> : TsmLanguagePlugin
export type FactoryReturn<Nested extends boolean = boolean> = (
  context: Context,
) => Nested extends true ? Array<TsmLanguagePlugin> : TsmLanguagePlugin
export type PluginReturn<UserOptions, Nested extends boolean = boolean> = (
  ...args: undefined extends UserOptions ? [UserOptions] | [] : [UserOptions]
) => FactoryReturn<Nested>

export type Code = Segment<CodeInformation>
export type CodeWithoutSource =
  | string
  | [text: string, sourceOffset: number, data: CodeInformation]
  | Code
export { CodeInformation, VirtualCode }

export interface Codes extends Array<Code> {
  replaceRange: (
    startOffset: number,
    endOffset: number,
    ...newSegments: CodeWithoutSource[]
  ) => boolean
  replace: (
    pattern: string | RegExp,
    ...replacers: (Code | ((match: string) => Code))[]
  ) => void
  replaceAll: (
    pattern: string | RegExp,
    ...replacers: (Code | ((match: string) => Code))[]
  ) => void
  toString: () => string
  getLength: () => number
}
