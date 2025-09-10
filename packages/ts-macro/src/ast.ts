/**
 * Modified from https://github.com/vuejs/core/blob/main/packages/compiler-core/src/babelUtils.ts
 *
 * https://github.com/vuejs/core/blob/main/LICENSE
 */

type Node = import('typescript').Node
type Identifier = import('typescript').Identifier

type NodeWithScopeIds = Node & { scopeIds?: Set<string> }

// TSTypeAssertion
export const TS_NODE_TYPES = [
  235 satisfies import('typescript').SyntaxKind.AsExpression, // foo as number
  217 satisfies import('typescript').SyntaxKind.TypeAssertionExpression, // (<number>foo)
  236 satisfies import('typescript').SyntaxKind.NonNullExpression, // foo!
  234 satisfies import('typescript').SyntaxKind.ExpressionWithTypeArguments, // foo<string>
  239 satisfies import('typescript').SyntaxKind.SatisfiesExpression, // foo satisfies T
]

export function isReferencedIdentifier(
  ts: typeof import('typescript'),
  id: Identifier,
  parent: Node | null | undefined,
): boolean {
  if (!parent) {
    return true
  }

  // is a special keyword but parsed as identifier
  if (id.escapedText === 'arguments') {
    return false
  }

  if (isReferenced(ts, id, parent)) {
    return true
  }

  // babel's isReferenced check returns false for ids being assigned to, so we
  // need to cover those cases here
  if (ts.isBinaryExpression(parent)) {
    return true
  }

  return false
}

export function isReferenced(
  ts: typeof import('typescript'),
  node: Node,
  parent: Node,
): boolean {
  // yes: PARENT[NODE]
  // yes: NODE.child
  // no: parent.NODE
  if (ts.isPropertyAccessExpression(parent)) {
    return parent.expression === node
  }
  // no: [NODE] = [];
  else if (ts.isElementAccessExpression(parent)) {
    return parent.argumentExpression === node || parent.expression === node
  }
  // no: let NODE = init;
  // yes: let id = NODE;
  else if (ts.isVariableDeclaration(parent)) {
    return parent.initializer === node
  }
  // yes: () => NODE
  // no: (NODE) => {}
  else if (ts.isArrowFunction(parent)) {
    return parent.body === node
  }
  // no: class { #NODE; }
  // no: class { get #NODE() {} }
  // no: class { #NODE() {} }
  // no: class { fn() { return this.#NODE; } }
  else if (ts.isPrivateIdentifier(parent)) {
    // PropertyAssignment
    return false
  }
  // no: class { NODE() {} }
  // yes: class { [NODE]() {} }
  // no: class { foo(NODE) {} }
  else if (ts.isMethodDeclaration(parent)) {
    if (ts.isComputedPropertyName(parent.name)) {
      return parent.name.expression === node
    }
    return false
  }
  // no: class { NODE = value; }
  // yes: class { [NODE] = value; }
  // yes: class { key = NODE; }

  // yes: { [NODE]: "" }
  // no: { NODE: "" }
  // depends: { NODE }
  // depends: { key: NODE }
  else if (ts.isPropertyAssignment(parent)) {
    if (ts.isComputedPropertyName(parent.name)) {
      return parent.name.expression === node
    }
    return true
  }
  // no: (({ NODE }) => [])
  // yes: (({ [NODE]: node }) => [])
  else if (ts.isBindingElement(parent)) {
    if (parent.propertyName && ts.isComputedPropertyName(parent.propertyName)) {
      return parent.propertyName.expression === node
    }
    return false
  }
  // no: class NODE {}
  // yes: class Foo extends NODE {}
  else if (ts.isClassDeclaration(parent) || ts.isClassExpression(parent)) {
    return !!parent.heritageClauses?.find((i) => i === node)
  }
  // yes: left = NODE;
  // no: NODE = right;

  // no: [NODE = foo] = [];
  // yes: [foo = NODE] = [];
  else if (ts.isBinaryExpression(parent)) {
    return parent.right === node
  } else if (
    // no: NODE: for (;;) {}
    ts.isLabeledStatement(parent) ||
    // no: try {} catch (NODE) {}
    ts.isCatchClause(parent) ||
    // no: function foo(...NODE) {}
    (ts.isParameter(parent) && parent.dotDotDotToken) ||
    // no: break NODE;
    ts.isBreakStatement(parent) ||
    // no: continue NODE;
    ts.isContinueStatement(parent) ||
    // no: function NODE() {}
    // no: function foo(NODE) {}
    ts.isFunctionDeclaration(parent) ||
    ts.isFunctionExpression(parent) ||
    // no: export NODE from "foo";
    ts.isExpressionStatement(parent) ||
    // no: export * as NODE from "foo";
    ts.isNamespaceExport(parent) ||
    // no: export default NODE;
    ts.isExportAssignment(parent)
  ) {
    return false
  }
  // no: export { foo as NODE };
  // yes: export { NODE as foo };
  // no: export { NODE as foo } from "foo";
  else if (ts.isExportSpecifier(parent)) {
    return parent.propertyName === node
  }
  // no: import NODE from "foo";
  // no: import * as NODE from "foo";
  // no: import { NODE as foo } from "foo";
  // no: import { foo as NODE } from "foo";
  // no: import NODE from "bar";
  else if (
    ts.isImportClause(parent) ||
    ts.isImportSpecifier(parent) ||
    ts.isNamespaceImport(parent)
  ) {
    return false
  } else if (
    // no: import "foo" assert { NODE: "json" }
    ts.isImportAttribute(parent) ||
    // no: <div NODE="foo" />
    ts.isJsxAttribute(parent) ||
    // no: new.NODE
    // no: NODE.target
    ts.isMetaProperty(parent)
  ) {
    return false
  }
  // yes: enum X { Foo = NODE }
  // no: enum X { NODE }
  else if (ts.isEnumMember(parent)) {
    return parent.name !== node
  }
  // yes: { [NODE]: value }
  // no: { NODE: value }
  // yes: type X = { someProperty: NODE }
  // no: type X = { NODE: OtherType }
  else if (ts.isPropertySignature(parent)) {
    if (ts.isComputedPropertyName(parent.name)) {
      return parent.name.expression === node
    }
    return parent.name !== node
  }

  return true
}

/**
 * Checks if the given node is a function type.
 *
 * @param ts The TypeScript module.
 * @param node - The node to check.
 * @returns True if the node is a function type, false otherwise.
 */
export function isFunctionType(
  ts: typeof import('typescript'),
  node: Node | undefined | null,
) {
  return (
    !!node &&
    (ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isArrowFunction(node))
  )
}

export function walkIdentifiers(
  ts: typeof import('typescript'),
  root: Node,
  onIdentifier: (
    node: Identifier,
    parent: Node | null | undefined,
    parentStack: Node[],
    isReference: boolean,
    isLocal: boolean,
  ) => void,
  includeAll = false,
  parentStack: Node[] = [],
  knownIds: Record<string, number> = Object.create(null),
): void {
  const rootExp = ts.isSourceFile(root)
    ? root.statements[0] &&
      ts.isExpressionStatement(root.statements[0]) &&
      root.statements[0].expression
    : root

  ts.forEachChild(root, function enter(node: Node, parent?: Node) {
    parent && parentStack.push(parent)
    if (
      parent &&
      (ts.isTypeNode(node) || ts.isTypeElement(node)) &&
      !TS_NODE_TYPES.includes(parent.kind)
    ) {
      return
    }
    if (ts.isIdentifier(node)) {
      const isLocal = !!knownIds[String(node.escapedText)]
      const isRefed = isReferencedIdentifier(ts, node, parent)
      if (includeAll || (isRefed && !isLocal)) {
        onIdentifier(node, parent, parentStack, isRefed, isLocal)
      }
    } else if (
      ts.isPropertyAssignment(node) &&
      parent &&
      ts.isObjectLiteralExpression(parent)
    ) {
      // mark property in destructure pattern
      ;(node as any).inPattern = true
    } else if (isFunctionType(ts, node)) {
      if ((node as NodeWithScopeIds).scopeIds) {
        ;(node as NodeWithScopeIds).scopeIds!.forEach((id: string) =>
          markKnownIds(id, knownIds),
        )
      } else {
        // walk function expressions and add its arguments to known identifiers
        // so that we don't prefix them
        walkFunctionParams(ts, node, (id) =>
          markScopeIdentifier(node, id, knownIds),
        )
      }
    } else if (ts.isBlock(node)) {
      if ((node as NodeWithScopeIds).scopeIds) {
        ;(node as NodeWithScopeIds).scopeIds!.forEach((id) =>
          markKnownIds(id, knownIds),
        )
      } else {
        // #3445 record block-level local variables
        walkBlockDeclarations(ts, node, (id) =>
          markScopeIdentifier(node, id, knownIds),
        )
      }
    } else if (ts.isCatchClause(node) && node.variableDeclaration) {
      for (const id of extractIdentifiers(ts, node.variableDeclaration)) {
        markScopeIdentifier(node, id, knownIds)
      }
    } else if (isForStatement(ts, node)) {
      walkForStatement(ts, node, false, (id) =>
        markScopeIdentifier(node, id, knownIds),
      )
    }

    ts.forEachChild(node, (child) => {
      enter(child, node)
      parent && parentStack.pop()
      if (child !== rootExp && (child as NodeWithScopeIds).scopeIds) {
        for (const id of (child as NodeWithScopeIds).scopeIds!) {
          knownIds[id]--
          if (knownIds[id] === 0) {
            delete knownIds[id]
          }
        }
      }
    })
  })
}

function markKnownIds(name: string, knownIds: Record<string, number>) {
  if (name in knownIds) {
    knownIds[name]++
  } else {
    knownIds[name] = 1
  }
}

function markScopeIdentifier(
  node: Node & { scopeIds?: Set<string> },
  child: Identifier,
  knownIds: Record<string, number>,
) {
  const name = String(child.escapedText)
  if (node.scopeIds && node.scopeIds.has(name)) {
    return
  }
  markKnownIds(name, knownIds)
  ;(node.scopeIds || (node.scopeIds = new Set())).add(name)
}

export function walkFunctionParams(
  ts: typeof import('typescript'),
  node:
    | import('typescript').ArrowFunction
    | import('typescript').FunctionExpression
    | import('typescript').FunctionDeclaration
    | import('typescript').MethodDeclaration,
  onIdent: (id: Identifier) => void,
): void {
  for (const p of node.parameters) {
    for (const id of extractIdentifiers(ts, p)) {
      onIdent(id)
    }
  }
}

/**
 * Extract identifiers of the given node.
 * @param ts The TypeScript module.
 * @param node The node to extract.
 * @param identifiers The array to store the extracted identifiers.
 * @see https://github.com/vuejs/core/blob/1f6a1102aa09960f76a9af2872ef01e7da8538e3/packages/compiler-core/src/babelUtils.ts#L208
 */
export function extractIdentifiers(
  ts: typeof import('typescript'),
  node: Node,
  identifiers: Identifier[] = [],
): Identifier[] {
  if (ts.isIdentifier(node)) {
    identifiers.push(node)
  } else if (ts.isPropertyAccessExpression(node)) {
    let exp: any = node
    while (ts.isPropertyAccessExpression(exp)) {
      exp = exp.expression
    }
    identifiers.push(exp)
  } else if (ts.isObjectBindingPattern(node)) {
    for (const prop of node.elements) {
      extractIdentifiers(ts, prop.name, identifiers)
    }
  } else if (ts.isArrayBindingPattern(node)) {
    node.elements.forEach((element) => {
      extractIdentifiers(ts, element, identifiers)
    })
  } else if (ts.isBindingElement(node)) {
    extractIdentifiers(ts, node.name, identifiers)
  } else if (ts.isBinaryExpression(node)) {
    extractIdentifiers(ts, node.left, identifiers)
  }

  return identifiers
}

export function walkBlockDeclarations(
  ts: typeof import('typescript'),
  block: import('typescript').Block | import('typescript').SourceFile,
  onIdent: (node: Identifier) => void,
): void {
  for (const stmt of block.statements) {
    if (ts.isVariableStatement(stmt)) {
      if (stmt.modifiers?.find((i) => i.kind === 138 /* DeclareKeyword */))
        continue
      for (const decl of stmt.declarationList.declarations) {
        for (const id of extractIdentifiers(ts, decl.name)) {
          onIdent(id)
        }
      }
    } else if (ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt)) {
      if (
        stmt.modifiers?.find((i) => i.kind === 138 /* DeclareKeyword */) ||
        !stmt.name
      )
        continue
      onIdent(stmt.name)
    } else if (isForStatement(ts, stmt)) {
      walkForStatement(ts, stmt, true, onIdent)
    }
  }
}

export function isForStatement(ts: typeof import('typescript'), stmt: Node) {
  return (
    ts.isForOfStatement(stmt) ||
    ts.isForInStatement(stmt) ||
    ts.isForStatement(stmt)
  )
}

export function walkForStatement(
  ts: typeof import('typescript'),
  stmt:
    | import('typescript').ForStatement
    | import('typescript').ForOfStatement
    | import('typescript').ForInStatement,
  isVar: boolean,
  onIdent: (id: Identifier) => void,
) {
  const variable = stmt.initializer
  if (
    variable &&
    ts.isVariableDeclarationList(variable) &&
    (variable.flags === 0 ? isVar : !isVar)
  ) {
    for (const decl of variable.declarations) {
      for (const id of extractIdentifiers(ts, decl.name)) {
        onIdent(id)
      }
    }
  }
}
