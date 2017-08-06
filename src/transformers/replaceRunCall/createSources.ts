import * as ts from 'typescript'

import { createVariableStatement } from './createVariableStatement'

export function createSources(
  name: string,
  sourcesIdentifier: ts.Identifier,
  sinksProxiesIdentifier: ts.Identifier
) {
  return createVariableStatement(
    ts.createVariableDeclaration(
      sourcesIdentifier,
      void 0,
      ts.createCall(ts.createIdentifier(name), [], [sinksProxiesIdentifier])
    )
  )
}
