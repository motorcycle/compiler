import * as ts from 'typescript'

export function findSinksKeys(node: ts.ExpressionStatement, checker: ts.TypeChecker) {
  const expression = node.expression as ts.CallExpression
  const { typeArguments } = expression

  if (typeArguments) {
    const [, SinksTypeNode] = typeArguments
    const { symbol } = checker.getTypeFromTypeNode(SinksTypeNode)

    return arrayFromIterator(symbol.members.keys())
  } else {
    const [UI] = expression.arguments as ts.NodeArray<ts.Identifier>
    const UISymbol = checker.getSymbolAtLocation(UI)
    const { symbol: { valueDeclaration } } = checker.getTypeOfSymbolAtLocation(UISymbol, UI)

    if (isFunctionLike(valueDeclaration)) {
      const signature = checker.getSignatureFromDeclaration(valueDeclaration)
      const { symbol } = checker.getReturnTypeOfSignature(signature)

      return arrayFromIterator(symbol.members.keys())
    }

    throw new Error(`Unable to find Sinks type's keys`)
  }
}

function isFunctionLike(dec: ts.Declaration): dec is ts.FunctionDeclaration {
  return ts.isFunctionDeclaration(dec) || ts.isFunctionExpression(dec) || ts.isArrowFunction(dec)
}

function arrayFromIterator<A>(iterator: Iterator<A>): Array<A> {
  return Array.from<A>({ [Symbol.iterator]: () => iterator })
}
