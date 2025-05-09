import { jiti } from '../options'
import type { Expression } from 'typescript'

export function getPluginsFromVite(
  configDir: string,
  ts: typeof import('typescript'),
) {
  try {
    const filename = `${configDir}/vite.config.ts`
    const content = ts.sys.readFile(filename, 'utf-8')
    if (!content) return

    const ast = ts.createSourceFile(
      'index.ts',
      content,
      99 satisfies typeof ts.ScriptTarget.Latest,
    )
    let exportPlugins: Expression[] = []
    const imports: { locals: string[]; from: string }[] = []
    for (const node of ast.statements) {
      if (ts.isExportAssignment(node)) {
        let arg: Expression | undefined = ts.isCallExpression(node.expression)
          ? node.expression.arguments[0]
          : node.expression
        if (ts.isArrowFunction(arg)) {
          arg = ts.isBlock(arg.body)
            ? arg.body.statements.find((i) => ts.isReturnStatement(i))
                ?.expression
            : ts.isParenthesizedExpression(arg.body)
              ? arg.body.expression
              : undefined
        }
        const properties =
          arg && ts.isObjectLiteralExpression(arg) ? arg.properties : []
        for (const prop of properties) {
          if (
            ts.isPropertyAssignment(prop) &&
            prop.name.getText(ast) === 'plugins' &&
            ts.isArrayLiteralExpression(prop.initializer)
          ) {
            exportPlugins = [...prop.initializer.elements]
          }
        }
      } else if (ts.isImportDeclaration(node) && node.importClause) {
        const locals: string[] = []
        if (node.importClause.namedBindings) {
          ts.forEachChild(node.importClause.namedBindings, (child) => {
            if (ts.isImportSpecifier(child)) {
              locals.push(child.name.getText(ast))
            }
          })
        } else {
          locals.push(node.importClause.getText(ast))
        }
        imports.push({
          locals,
          from: node.moduleSpecifier.getText(ast).slice(1, -1),
        })
      }
    }
    if (!exportPlugins.length) return

    return exportPlugins
      .map((plugin) => {
        const pluginName = (
          ts.isCallExpression(plugin) ? plugin.expression : plugin
        ).getText(ast)

        const item = imports.find((i) => i.locals.includes(pluginName))
        if (!item) return

        for (const path of [
          // support unplugin
          `${item.from.split('/').slice(0, -1).join('/')}/volar`,
          `${item.from}/volar`,
        ]) {
          try {
            const from = require.resolve(path, {
              paths: [configDir],
            })
            let module = jiti(from)
            module = module?.default ?? module
            return ts.isCallExpression(plugin)
              ? module(
                  plugin.arguments[0]
                    ? new Function(
                        `return ${
                          ts.transpileModule(
                            `(${plugin.arguments[0].getText(ast)})`,
                            {
                              compilerOptions: { module: ts.ModuleKind.ESNext },
                            },
                          ).outputText
                        }`,
                      )()
                    : undefined,
                )
              : module(from)
          } catch {}
        }
      })
      .filter(Boolean)
  } catch {}
}
