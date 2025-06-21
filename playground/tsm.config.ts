import { createPlugin, replaceRange } from 'ts-macro'

const plugin = createPlugin(({ ts }) => {
  return {
    name: 'jsx-directive',
    resolveVirtualCode({ ast, codes }) {
      ast.forEachChild(function walk(node) {
        if (
          ts.isJsxAttribute(node) &&
          ts.isJsxExpression(node.initializer!) &&
          node.name.getText(ast) === 'v-if'
        ) {
          const { pos, end } = node.parent.parent.parent
          const text = node.initializer.expression!.getText(ast)
          // 把 v-if 表达式移动到标签前 作为三元表达式的条件
          replaceRange(codes, pos, pos, `{ ${text} ? `)
          // 补全三元表达式
          replaceRange(codes, end, end, ' : null }')
          // 删除 v-if 指令
          replaceRange(codes, node.pos, node.end)
        }
        // 递归遍历AST
        node.forEachChild(walk)
      })
    },
  }
})

export default {
  plugins: [plugin()],
}
