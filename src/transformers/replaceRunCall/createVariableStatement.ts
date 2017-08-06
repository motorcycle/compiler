import * as ts from 'typescript'

export function createVariableStatement(...values: ts.VariableDeclaration[]) {
  return ts.createVariableStatement(
    [],
    ts.createVariableDeclarationList(values, ts.NodeFlags.Const)
  )
}
