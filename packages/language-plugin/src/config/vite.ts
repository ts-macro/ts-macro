import { jiti } from '../options'

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
    let exportPlugins: import('typescript').Expression[] = []
    const imports: { locals: string[]; from: string }[] = []
    for (const node of ast.statements) {
      if (
        ts.isExportAssignment(node) &&
        ts.isCallExpression(node.expression) &&
        ts.isObjectLiteralExpression(node.expression.arguments[0])
      ) {
        for (const prop of node.expression.arguments[0].properties) {
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
            let module = jiti(from).default
            module = module?.default ?? module
            return ts.isCallExpression(plugin)
              ? module(
                  plugin.arguments[0]
                    ? eval(`(${plugin.arguments[0].getText(ast)})`)
                    : undefined,
                )
              : module(from)
          } catch {}
        }
      })
      .filter(Boolean)
  } catch {}
}
