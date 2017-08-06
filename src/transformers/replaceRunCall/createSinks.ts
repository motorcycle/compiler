import * as ts from 'typescript'

import { createVariableStatement } from './createVariableStatement'

export function createSinks(
  name: string,
  sinksIdentifier: ts.Identifier,
  sourcesIdentifier: ts.Identifier
) {
  return createVariableStatement(
    ts.createVariableDeclaration(
      sinksIdentifier,
      void 0,
      ts.createCall(ts.createIdentifier(name), [], [sourcesIdentifier])
    )
  )
}
