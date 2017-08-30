import * as ts from 'typescript'

import { createVariableStatement } from './createVariableStatement'

export function createSinkProxies(
  identifier: ts.Identifier,
  sinksKeys: ReadonlyArray<string>
): ts.VariableStatement {
  return createVariableStatement(
    ts.createVariableDeclaration(
      identifier,
      void 0,
      ts.createObjectLiteral(sinksKeys.map(createSinksProxyProperty), true)
    )
  )
}

function createSinksProxyProperty(key: string): ts.PropertyAssignment {
  return ts.createPropertyAssignment(key, ts.createIdentifier('createProxy().stream'))
}
