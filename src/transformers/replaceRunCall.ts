import * as ts from 'typescript'

import { TransformFactoryFactory } from '../'

export const replaceRunCall: TransformFactoryFactory = replaceRunCallTransformerFactory

function replaceRunCallTransformerFactory(program: ts.Program) {
  const checker = program.getTypeChecker()

  Function.prototype(checker)

  return function(context: ts.TransformationContext) {
    let hasSchedulerImport = false
    let hasProxyImport = false

    return function(sourceFile: ts.SourceFile) {
      const visitedNode = ts.visitEachChild(sourceFile, visitor, context)

      ts.addEmitHelpers(visitedNode, context.readEmitHelpers())

      return visitedNode

      function visitor(node: ts.Node): ts.Node | ts.Node[] {
        const createProxyName = ts.createIdentifier('createProxy')
        const schedulerName = ts.createIdentifier('scheduler')
        const sinkProxiesName = ts.createIdentifier('sinkProxies')
        const sourcesName = ts.createIdentifier('sources')
        const sinksName = ts.createIdentifier('sinks')

        if (
          ts.isImportDeclaration(node) &&
          node.getText(sourceFile).endsWith(`'@motorcycle/stream'`)
        ) {
          const { importClause: { namedBindings } } = node
          const { elements } = namedBindings as ts.NamedImports

          const specifiers: Array<ts.ImportSpecifier> = [...elements]

          hasProxyImport = elements.some(n => n.getText().indexOf(createProxyName.text) > -1)

          if (!hasProxyImport) {
            hasProxyImport = true

            specifiers.push(
              ts.createImportSpecifier(void 0, ts.createIdentifier(createProxyName.text))
            )
          }

          hasSchedulerImport = elements.some(n => n.getText().indexOf(schedulerName.text) > -1)

          if (!hasSchedulerImport) {
            hasSchedulerImport = true

            specifiers.push(
              ts.createImportSpecifier(void 0, ts.createIdentifier(schedulerName.text))
            )
          }

          return ts.createImportDeclaration(
            [],
            [],
            ts.createImportClause(void 0, ts.createNamedImports(specifiers)),
            ts.createIdentifier('@motorcycle/stream')
          )
        }

        if (ts.isExpressionStatement(node)) {
          const children = node.getChildren()

          for (const child of children) {
            if (isRunExpression(child, sourceFile)) {
              const [, sinksTypeName] = getTypeArgumentNames(child, sourceFile)
              const [Main, Effects] = getArgumentNames(child as any)

              const sinksNode = findNode(isSinksDeclaration(sinksTypeName), program)
              const sinksMembers = checker.getTypeAtLocation(sinksNode).symbol.members

              const keys: Array<string> = []

              sinksMembers.forEach((_: ts.Symbol, key: string) => {
                keys.push(key)
              })

              const properties = keys.map(key => {
                return ts.createPropertyAssignment(key, ts.createIdentifier('createProxy().stream'))
              }) as Array<any>

              const sinkProxyObject = ts.createObjectLiteral(properties, true)

              const sinkProxies = createVariableStatement(
                ts.createVariableDeclaration(sinkProxiesName, void 0, sinkProxyObject)
              )

              const sources = createVariableStatement(
                ts.createVariableDeclaration(
                  sourcesName,
                  void 0,
                  ts.createCall(ts.createIdentifier(Effects), [], [sinkProxiesName])
                )
              )

              const sinks = createVariableStatement(
                ts.createVariableDeclaration(
                  sinksName,
                  void 0,
                  ts.createCall(ts.createIdentifier(Main), [], [sourcesName])
                )
              )

              const nodes: Array<ts.Node> = [sinkProxies, sources, sinks]

              if (!hasSchedulerImport || !hasProxyImport) {
                const specifiers: Array<ts.ImportSpecifier> = []

                if (!hasSchedulerImport) {
                  hasSchedulerImport = true
                  specifiers.push(ts.createImportSpecifier(void 0, schedulerName))
                }

                if (!hasProxyImport) {
                  hasProxyImport = true
                  specifiers.push(ts.createImportSpecifier(void 0, createProxyName))
                }

                nodes.unshift(
                  ts.createImportDeclaration(
                    [],
                    [],
                    ts.createImportClause(void 0, ts.createNamedImports(specifiers)),
                    ts.createLiteral(`@motorcycle/stream`)
                  )
                )
              }

              return nodes.concat(
                keys.map(key => {
                  return ts.createCall(
                    ts.createIdentifier(sinksName.text + `.${key}.run`),
                    [],
                    [ts.createIdentifier(sinkProxiesName.text + `.${key}`), schedulerName]
                  )
                })
              )
            }
          }
        }

        return node
      }
    }
  }
}

function createVariableStatement(...values: ts.VariableDeclaration[]) {
  return ts.createVariableStatement(
    [],
    ts.createVariableDeclarationList(values, ts.NodeFlags.Const)
  )
}

function isSinksDeclaration(name: string) {
  return function(node: ts.Node, sourceFile: ts.SourceFile): boolean {
    if (ts.isTypeAliasDeclaration(node))
      return node.getText(sourceFile).startsWith(`export type ${name}`)

    if (ts.isInterfaceDeclaration(node))
      return node.getText(sourceFile).startsWith(`export interface ${name}`)

    return false
  }
}

function findNode(
  predicate: (node: ts.Node, sourceFile: ts.SourceFile) => boolean,
  program: ts.Program
): ts.Node | null {
  for (const sourceFile of program.getSourceFiles()) {
    const children: Array<ts.Node> = sourceFile.getChildren()

    while (children.length > 0) {
      const child = children.shift() as ts.Node

      if (predicate(child, sourceFile)) {
        child.parent = sourceFile

        return child
      }

      children.push(...child.getChildren(sourceFile))
    }
  }

  return null
}

function getArgumentNames(node: ts.CallExpression): [string, string] {
  const [Main, Effects] = node.arguments

  return [Main.getText(), Effects.getText()]
}

function getTypeArgumentNames(
  node: ts.CallExpression,
  sourceFile: ts.SourceFile
): [string, string] {
  const [Sources, Sinks] = node.typeArguments

  return [Sources.getText(sourceFile), Sinks.getText(sourceFile)]
}

function isRunExpression(node: ts.Node, sourceFile: ts.SourceFile): node is ts.CallExpression {
  return node.getText(sourceFile).startsWith('run')
}
