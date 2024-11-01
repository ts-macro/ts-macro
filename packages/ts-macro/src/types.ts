import type { TsmVirtualCode } from './virtual-code'
import type { CodeInformation } from '@volar/language-core'
import type { Segment } from 'muggle-string'

export type Code = Segment<CodeInformation>

export type Options = {
  plugins: (Plugin | Plugin[])[]
}

export type Plugin = {
  name: string
  enforce?: 'pre' | 'post'
  resolveVirtualCode?: (virtualCode: TsmVirtualCode) => void
}
