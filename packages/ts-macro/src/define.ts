import { codesProxyHandler } from './muggle-string'
import { getStart, getText, isJsxExpression } from './vue'
import type { Factory, Options, PluginReturn } from './types'
import type { Node, NodeArray, SourceFile } from 'typescript'

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
      const ts = options.modules.typescript as typeof import('typescript')
      const plugins = factory({
        ts,
        ...options,
      })

      return (Array.isArray(plugins) ? plugins : [plugins]).flatMap(
        (result) => {
          if (result.resolveVirtualCode) {
            result.resolveEmbeddedCode ??= (
              filePath: string,
              sfc: any,
              embeddedFile: any,
            ) => {
              if (!['script_ts', 'script_tsx'].includes(embeddedFile.id)) return
              for (const source of ['script', 'scriptSetup'] as const) {
                const ast = sfc[source]?.ast
                if (!ast) continue

                patchAST(ast, ts)

                result.resolveVirtualCode({
                  sfc,
                  ast,
                  source,
                  filePath,
                  id: embeddedFile.id,
                  codes: codesProxyHandler(embeddedFile.content, source),
                  languageId: embeddedFile.lang,
                  embeddedCodes: embeddedFile.embeddedCodes,
                  linkedCodeMappings: embeddedFile.linkedCodeMappings,
                })
              }
            }
          }
          result.order ??=
            result.enforce === 'pre' ? -1 : result.enforce === 'post' ? 1 : 0
          result.version ??= 2.1
          return result
        },
      )
    }
    return (context: any) => factory(context, options)
  }
}

function patchAST(ast: any, ts: typeof import('typescript')) {
  if (ast._patched) return
  ast._patched = true
  addProperties(Object.getPrototypeOf(ast))
  ts.forEachChild(ast, function walk(node: Node, parent: Node = ast) {
    // @ts-ignore
    node.parent = parent
    if (ts.isIdentifier(node) && !node.text) {
      addProperties(Object.getPrototypeOf(node))
      Object.defineProperty(Object.getPrototypeOf(node), 'text', {
        get() {
          return ts.idText(this)
        },
        enumerable: true,
        configurable: true,
      })
    } else if (!node.forEachChild) {
      addProperties(node)
    }
    ts.forEachChild(node, (child) => {
      walk(child, node)
    })
  })

  ts.isJsxExpression ??= function (node: Node) {
    return isJsxExpression(node)
  }

  function addProperties(node: Node) {
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!node.getSourceFile) return
    node.getSourceFile = () => {
      while (node && node.kind !== ts.SyntaxKind.SourceFile) {
        node = node.parent
      }
      return node as SourceFile
    }
    node.getFullStart = () => node.pos
    node.getStart = (ast = node.getSourceFile()) => getStart(node, ast, ts)
    node.getEnd = () => node.end
    node.getText = (ast = node.getSourceFile()) => getText(node, ast, ts)
    node.getFullText = (ast = node.getSourceFile()) =>
      ast ? ast.text.slice(node.pos, node.end) : ''
    node.getWidth = (ast?: SourceFile) => node.end - node.getStart(ast)
    node.getFullWidth = () => node.end - node.pos
    node.getLeadingTriviaWidth = (ast?: SourceFile) =>
      node.getStart(ast) - node.pos
    node.forEachChild = <T>(
      cbNode: (node: Node) => T | undefined,
      cbNodes?: (nodes: NodeArray<Node>) => T | undefined,
    ) => ts.forEachChild(node, cbNode, cbNodes)
  }
}
