// https://github.com/volarjs/volar.js/issues/165

export function getStart(
  node:
    | import('typescript').Node
    | import('typescript').NodeArray<import('typescript').Node>,
  ast?: import('typescript').SourceFileLike | undefined,
  ts?: typeof import('typescript'),
): number {
  return ts ? (ts as any).getTokenPosOfNode(node, ast) : node.pos
}

export function getText(
  node: import('typescript').Node,
  ast?: import('typescript').SourceFileLike,
  ts?: typeof import('typescript'),
): string {
  return ast ? ast.text.slice(getStart(node, ast, ts), node.end) : ''
}

export function isJsxExpression(
  node?: import('typescript').Node,
): node is import('typescript').JsxExpression {
  return node?.kind === 294
}
