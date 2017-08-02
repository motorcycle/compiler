import * as ts from 'typescript'

import { TransformFactoryFactory } from '../'

export const removeRunImport: TransformFactoryFactory = removeRunImportTransformerFactory

function removeRunImportTransformerFactory(program: ts.Program) {
  Function.prototype(program)

  return function(context: ts.TransformationContext) {
    return function(sourceFile: ts.SourceFile) {
      if (!sourceFile) return

      const visitedNode = ts.visitEachChild(sourceFile, visitor, context)

      ts.addEmitHelpers(visitedNode, context.readEmitHelpers())

      return visitedNode

      function visitor(node: ts.Node): ts.Node {
        if (ts.isImportDeclaration(node) && isRunImport(node, sourceFile)) {
          return void 0
        }

        return node
      }
    }
  }
}

function isRunImport(node: ts.ImportDeclaration, sourceFile: ts.SourceFile): boolean {
  const text = sourceFile.text.substring(node.getStart(sourceFile), node.getEnd())

  return text.indexOf('@motorcycle/run') > -1
}
