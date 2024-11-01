import { replaceSourceRange } from 'muggle-string'
import { defineConfig, type Plugin } from 'ts-macro'

function defineStylePlugin(userOptions = { macro: 'defineStyle' }): Plugin {
  return {
    name: 'volar-plugin-define-style',
    enforce: 'pre',
    resolveVirtualCode({ ts, ast, codes }) {
      codes.push(`
       type __VLS_StyleArgs = [style: string, options?: { scoped?: boolean }]
       declare const defineStyle: { <T>(...args: __VLS_StyleArgs): T; scss: <T>(...args: __VLS_StyleArgs)=> T; sass: <T>(...args: __VLS_StyleArgs)=> T; stylus: <T>(...args: __VLS_StyleArgs)=> T; less: <T>(...args: __VLS_StyleArgs)=> T; postcss: <T>(...args: __VLS_StyleArgs)=> T } 
      `)

      ts.forEachChild(ast, walk)
      function walk(
        node: import('typescript').Node,
        parents: import('typescript').Node[] = [],
      ) {
        if (
          parents[2] &&
          ts.isVariableStatement(parents[2]) &&
          ts.isCallExpression(node) &&
          node.expression.getText(ast).startsWith(userOptions.macro)
        ) {
          replaceSourceRange(
            codes,
            undefined,
            node.arguments.pos - 1,
            node.arguments.pos - 1,
            '<{ foo: string }>',
          )
        }

        ts.forEachChild(node, (child) => {
          parents.unshift(node)
          walk(child, parents)
          parents.shift()
        })
      }
    },
  }
}

export default defineConfig({
  plugins: [defineStylePlugin()],
})
