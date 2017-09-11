import * as ts from 'typescript'

export function findSinksKeys(node: ts.ExpressionStatement, checker: ts.TypeChecker) {
  const expression = node.expression as ts.CallExpression
  const { typeArguments } = expression

  if (typeArguments) {
    const [, SinksTypeNode] = typeArguments
    const type = checker.getTypeFromTypeNode(SinksTypeNode)

    return findSinkNames(type)
  } else {
    const [UI] = expression.arguments as ts.NodeArray<ts.Identifier>
    const UISymbol = checker.getSymbolAtLocation(UI)
    const { symbol: { valueDeclaration } } = checker.getTypeOfSymbolAtLocation(UISymbol, UI)

    if (isFunctionLike(valueDeclaration)) {
      const signature = checker.getSignatureFromDeclaration(valueDeclaration)
      const type = checker.getReturnTypeOfSignature(signature)

      return findSinkNames(type)
    }

    throw new Error(`Unable to find Sinks type's keys`)
  }
}

function findSinkNames(type: ts.Type): ReadonlyArray<string> {
  const symbol = type.getSymbol()

  if (symbol && symbol.members) return arrayFromIterator(symbol.members.keys())

  return type.getProperties().map(property => property.getName())
}

function isFunctionLike(dec: ts.Declaration): dec is ts.FunctionDeclaration {
  return ts.isFunctionDeclaration(dec) || ts.isFunctionExpression(dec) || ts.isArrowFunction(dec)
}

function arrayFromIterator(iterator: Iterator<ts.__String>): Array<string> {
  return Array.from({ [Symbol.iterator]: () => iterator }).map(String)
}
