import { getText } from './utils'

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
            getText(prop.name, ast, ts) === 'plugins' &&
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
              locals.push(getText(child.name, ast, ts))
            }
          })
        } else {
          locals.push(getText(node.importClause, ast, ts))
        }
        imports.push({
          locals,
          from: getText(node.moduleSpecifier, ast, ts).slice(1, -1),
        })
      }
    }
    if (!exportPlugins.length) return

    return exportPlugins
      .map((plugin) => {
        const pluginName = getText(
          ts.isCallExpression(plugin) ? plugin.expression : plugin,
          ast,
          ts,
        )
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
            let module = require(from)
            module = module?.default ?? module
            return ts.isCallExpression(plugin)
              ? module(
                  plugin.arguments[0]
                    ? eval(`(${getText(plugin.arguments[0], ast, ts)})`)
                    : undefined,
                )
              : module(from)
          } catch {}
        }
      })
      .filter(Boolean)
  } catch {}
}
