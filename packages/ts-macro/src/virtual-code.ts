import { toString, type Segment } from 'muggle-string'
import type { TsmLanguagePlugin } from './types'
import type {
  CodeInformation,
  CodeMapping,
  Mapping,
  VirtualCode,
} from '@volar/language-core'

export type Code = Segment<CodeInformation>
export { CodeInformation, VirtualCode }

export const allCodeFeatures = {
  completion: true,
  format: true,
  navigation: true,
  semantic: true,
  structure: true,
  verification: true,
}

export class TsmVirtualCode implements VirtualCode {
  readonly id = 'root'
  mappings: CodeMapping[]
  embeddedCodes: VirtualCode[] = []
  codes: Code[] = []
  snapshot: import('typescript').IScriptSnapshot
  text = ''
  source: 'script' | 'scriptSetup' | undefined

  constructor(
    public readonly fileName: string,
    public readonly rawText: string,
    public readonly ast: import('typescript').SourceFile,
    public readonly languageId: string = 'tsx',
    private readonly plugins: TsmLanguagePlugin[] = [],
  ) {
    this.codes.push(
      `/* placeholder */\n`,
      [`\n`, undefined, 0, allCodeFeatures],
      [this.rawText, undefined, 0, allCodeFeatures],
    )

    for (const plugin of this.plugins) {
      try {
        plugin.resolveVirtualCode?.(this)
      } catch (error) {
        console.error(`[${plugin.name}]:`, error)
      }
    }

    this.mappings = buildMappings(this.codes)
    this.text = toString(this.codes)
    this.snapshot = {
      getLength: () => this.text.length,
      getText: (start, end) => this.text.slice(start, end),
      getChangeRange() {
        return undefined
      },
    }
  }
}

function buildMappings<T>(chunks: Segment<T>[]) {
  let length = 0
  const mappings: Mapping<T>[] = []
  for (const segment of chunks) {
    if (typeof segment === 'string') {
      length += segment.length
    } else {
      mappings.push({
        sourceOffsets: [segment[2]],
        generatedOffsets: [length],
        lengths: [segment[0].length],
        data: segment[3]!,
      })
      length += segment[0].length
    }
  }
  return mappings
}
