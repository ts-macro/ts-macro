import { replaceRange } from 'muggle-string'
import { defineConfig, type Plugin } from 'ts-macro'
import type { VirtualCode } from '@volar/language-core'

function defineStylePlugin(userOptions = { macro: 'defineStyle' }): Plugin {
  return {
    name: 'volar-plugin-define-style',
    enforce: 'pre',
    resolveVirtualCode({ ts, ast, codes, embeddedCodes }) {
      // append the defineStyle type for every ts file
      codes.push(`
       type __VLS_StyleArgs = [style: string, options?: { scoped?: boolean }]
       declare const defineStyle: { <T>(...args: __VLS_StyleArgs): T; scss: <T>(...args: __VLS_StyleArgs)=> T; sass: <T>(...args: __VLS_StyleArgs)=> T; stylus: <T>(...args: __VLS_StyleArgs)=> T; less: <T>(...args: __VLS_StyleArgs)=> T; postcss: <T>(...args: __VLS_StyleArgs)=> T } 
      `)

      // add embedded codes
      embeddedCodes.push(...getEmbeddedCodes(ts, ast))

      // walk the AST to find the defineStyle calls, and automatically add the generic type
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
          replaceRange(
            codes,
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
  plugins: [
    defineStylePlugin({
      macro: 'defineStyle',
    }),
  ],
})

function* getEmbeddedCodes(
  ts: typeof import('typescript'),
  ast: import('typescript').SourceFile,
): Generator<VirtualCode> {
  const styles: import('typescript').CallExpression[] = []
  const walk = (ast: import('typescript').Node) => {
    ts.forEachChild(ast, (node) => {
      if (
        ts.isCallExpression(node) &&
        (ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression)
          ? node.expression.expression.text
          : ts.isIdentifier(node.expression) && node.expression.text) ===
          'defineStyle' &&
        node.arguments[0] &&
        ts.isTemplateLiteral(node.arguments[0])
      ) {
        styles.push(node)
      }
      walk(node)
    })
  }
  walk(ast)

  for (const [i, node] of styles.entries()) {
    const languageId =
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.name)
        ? node.expression.name.text
        : 'css'
    const style = node.arguments[0]
    const styleText = style.getText(ast).slice(1, -1).replaceAll('${', ' {')

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
          sourceOffsets: [style.getStart(ast)! + 1],
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
