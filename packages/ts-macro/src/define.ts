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
                  lang: embeddedFile.lang,
                  languageId:
                    embeddedFile.lang === 'js'
                      ? 'javascript'
                      : embeddedFile.lang === 'jsx'
                        ? 'javascriptreact'
                        : embeddedFile.lang === 'tsx'
                          ? 'typescriptreact'
                          : 'typescript',
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

function patchAST(
  ast: import('typescript').SourceFile,
  ts: typeof import('typescript'),
) {
  // eslint-disable-next-line no-extra-boolean-cast
  if (!!ast.forEachChild) return
  addProperties(ast)
  ts.forEachChild(ast, function walk(node: Node) {
    if (ts.isIdentifier(node) && !node.text) {
      Object.defineProperty(Object.getPrototypeOf(node), 'text', {
        get() {
          return ts.idText(this)
        },
        enumerable: true,
        configurable: true,
      })
    }
    addProperties(node)
    ts.forEachChild(node, (child) => {
      walk(child)
    })
  })

  ts.isJsxExpression ??= function (node: Node) {
    return isJsxExpression(node)
  }

  function addProperties(node: Node) {
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
