import { toString, type Segment } from 'muggle-string'
import type { Code, Options, Plugin } from './types'
import type {
  CodeMapping,
  Mapping,
  VirtualCode as VirtualCode,
} from '@volar/language-core'

export const allCodeFeatures = {
  completion: true,
  format: true,
  navigation: true,
  semantic: true,
  structure: true,
  verification: true,
}

export class TsmVirtualCode implements VirtualCode {
  id = 'root'
  mappings: CodeMapping[]
  embeddedCodes: VirtualCode[] = []
  codes: Code[] = []
  snapshot: import('typescript').IScriptSnapshot
  text = ''
  rawText = ''

  ast: import('typescript').SourceFile

  constructor(
    public fileName: string,
    public rawSnapshot: import('typescript').IScriptSnapshot,
    public ts: typeof import('typescript'),
    public languageId: string,
    public options: Partial<Options> = {},
  ) {
    this.rawText = rawSnapshot.getText(0, rawSnapshot.getLength()).toString()

    this.codes.push([this.rawText, undefined, 0, allCodeFeatures])

    this.ast = ts.createSourceFile(
      `index.${languageId}`,
      this.rawText,
      ts.ScriptTarget.Latest,
    )

    let plugins: Plugin[] = []
    try {
      plugins = sortPlugins((options?.plugins ?? []).flat())
    } catch (error) {
      console.error(error)
    }

    for (const plugin of plugins) {
      try {
        plugin.resolveVirtualCode?.(this)
      } catch (error) {
        console.error(`[${plugin.name}]:`, error)
      }
    }

    this.mappings = buildMappings(this.codes)
    const text = (this.text = toString(this.codes))
    this.snapshot = {
      getLength() {
        return text.length
      },
      getText(start, end) {
        return text.slice(start, end)
      },
      getChangeRange() {
        return undefined
      },
    }

    if (this.ast) this.embeddedCodes = [...this.getEmbeddedCodes(this.ast)]
  }
  *getEmbeddedCodes(
    sourceFile: import('typescript').SourceFile,
  ): Generator<VirtualCode> {
    const styles: import('typescript').CallExpression[] = []
    const walk = (ast: import('typescript').Node) => {
      this.ts.forEachChild(ast, (node) => {
        if (
          this.ts.isCallExpression(node) &&
          (this.ts.isPropertyAccessExpression(node.expression) &&
          this.ts.isIdentifier(node.expression.expression)
            ? node.expression.expression.text
            : this.ts.isIdentifier(node.expression) && node.expression.text) ===
            'defineStyle' &&
          node.arguments[0] &&
          this.ts.isTemplateLiteral(node.arguments[0])
        ) {
          styles.push(node)
        }
        walk(node)
      })
    }
    walk(sourceFile)

    for (const [i, node] of styles.entries()) {
      const languageId =
        this.ts.isPropertyAccessExpression(node.expression) &&
        this.ts.isIdentifier(node.expression.name)
          ? node.expression.name.text
          : 'css'
      const style = node.arguments[0]
      const styleText = style
        .getText(this.ast)
        .slice(1, -1)
        .replaceAll('${', ' {')

      yield {
        id: `style_${i}`,
        languageId,
        snapshot: {
          getText: (start, end) => styleText.slice(start, end),
          getLength: () => styleText.length,
          getChangeRange: () => undefined,
        },
        mappings: [
          {
            sourceOffsets: [style.getStart(this.ast)! + 1],
            generatedOffsets: [0],
            lengths: [styleText.length],
            data: {
              completion: true,
              format: true,
              navigation: true,
              semantic: true,
              structure: true,
              verification: true,
            },
          },
        ],
        embeddedCodes: [],
      }
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

export function sortPlugins(plugins: Plugin[]): Plugin[] {
  const prePlugins: Plugin[] = []
  const postPlugins: Plugin[] = []
  const normalPlugins: Plugin[] = []

  if (plugins) {
    plugins.flat().forEach((p) => {
      if (p.enforce === 'pre') prePlugins.push(p)
      else if (p.enforce === 'post') postPlugins.push(p)
      else normalPlugins.push(p)
    })
  }

  return [...prePlugins, ...normalPlugins, ...postPlugins]
}
