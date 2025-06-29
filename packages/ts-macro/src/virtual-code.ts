import { toString, type Segment } from 'muggle-string'
import type { Code, TsmLanguagePlugin } from './types'
import type { CodeMapping, Mapping, VirtualCode } from '@volar/language-core'

export const allCodeFeatures = {
  completion: true,
  format: true,
  navigation: true,
  semantic: true,
  structure: true,
  verification: true,
}

export class TsmVirtualCode implements VirtualCode {
  id: string
  mappings: CodeMapping[]
  embeddedCodes: VirtualCode[] = []
  codes: Code[] = []
  snapshot: import('typescript').IScriptSnapshot
  source: 'script' | 'scriptSetup' | undefined
  linkedCodeMappings: Mapping[] = []

  constructor(
    public readonly filePath: string,
    public readonly ast: import('typescript').SourceFile,
    public readonly languageId: string = 'tsx',
    private readonly plugins: TsmLanguagePlugin[] = [],
  ) {
    this.id = `root_${this.languageId}`
    this.codes.push([ast.text, undefined, 0, allCodeFeatures])

    for (const plugin of this.plugins) {
      try {
        plugin.resolveVirtualCode?.(this)
      } catch (error) {
        console.error(`[${plugin.name}]:`, error)
      }
    }

    this.mappings = buildMappings(this.codes)
    const text = toString(this.codes)
    this.snapshot = {
      getLength: () => text.length,
      getText: (start, end) => text.slice(start, end),
      getChangeRange() {
        return undefined
      },
    }
  }
}

export function buildMappings<T>(chunks: Segment<T>[]) {
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
