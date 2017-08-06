import * as ts from 'typescript'

import { TransformFactoryFactory } from '../../'
import { createSinkProxies } from './createSinkProxies'
import { createSinks } from './createSinks'
import { createSources } from './createSources'
import { findSinksKeys } from './findSinksKeys'

export const replaceRunCall: TransformFactoryFactory = replaceRunCallTransformerFactory

function replaceRunCallTransformerFactory(program: ts.Program) {
  const checker = program.getTypeChecker()

  return function(context: ts.TransformationContext) {
    return function(sourceFile: ts.SourceFile) {
      const visitedNode = ts.visitEachChild(sourceFile, visitor, context)

      ts.addEmitHelpers(visitedNode, context.readEmitHelpers())

      return visitedNode

      function visitor(node: ts.Node): ts.Node | ts.Node[] {
        checker.getTypeAtLocation(node)

        if (
          ts.isExpressionStatement(node) &&
          node.getChildren().some(isRunExpression(sourceFile))
        ) {
          const sinksKeys = findSinksKeys(node, checker)
          const sinkProxiesIdentifier = ts.createIdentifier(
            'sinkProxies__generated__by__motorcycle__compiler'
          )
          const sourcesIdentifier = ts.createIdentifier(
            'sources__generated__by__motorcycle__compiler'
          )
          const sinksIdentifier = ts.createIdentifier('sinks__generated__by__motorcycle__compiler')

          const [UIName, EffectsName] = getFunctionNames(node, sourceFile)

          return [
            createSinkProxies(sinkProxiesIdentifier, sinksKeys),
            createSources(EffectsName, sourcesIdentifier, sinkProxiesIdentifier),
            createSinks(UIName, sinksIdentifier, sourcesIdentifier),
            ...replicateSinks(sinksKeys, sinksIdentifier, sinkProxiesIdentifier),
          ]
        }

        return node
      }
    }
  }
}

function replicateSinks(keys: Array<string>, sinks: ts.Identifier, proxies: ts.Identifier) {
  return keys.map(key =>
    ts.createCall(
      ts.createIdentifier(sinks.text + `.${key}.run`),
      [],
      [ts.createIdentifier(proxies.text + `.${key}`), ts.createIdentifier('scheduler')]
    )
  )
}

function getFunctionNames(node: ts.ExpressionStatement, sourceFile: ts.SourceFile) {
  return (node.expression as ts.CallExpression).arguments.map((e: ts.Expression) =>
    e.getText(sourceFile)
  )
}

function isRunExpression(sourceFile: ts.SourceFile) {
  return function(node: ts.Node): node is ts.CallExpression {
    return node.getText(sourceFile).startsWith('run')
  }
}
