import * as ts from 'typescript'

import { TransformFactoryFactory } from '../'

export const addMissingImports: TransformFactoryFactory = addMissingImportsTransformerFactory

function addMissingImportsTransformerFactory(program: ts.Program) {
  const checker = program.getTypeChecker()

  return function(context: ts.TransformationContext) {
    return function(sourceFile: ts.SourceFile) {
      const imports = findAllImports(sourceFile, context)
      const hasStreamImport = fileHasStreamImport(imports, sourceFile)

      const visitor = hasStreamImport ? addImportSpecifiersVisitor : addImportDeclarationVisitor

      const visitedNode = ts.visitEachChild(sourceFile, visitor, context)

      ts.addEmitHelpers(visitedNode, context.readEmitHelpers())

      return visitedNode

      function addImportDeclarationVisitor(node: ts.Node): ts.Node | ts.Node[] {
        checker.getTypeAtLocation(node)

        if (ts.isImportDeclaration(node) && node === imports[0]) {
          return [
            ts.createImportDeclaration(
              [],
              [],
              ts.createImportClause(
                void 0,
                ts.createNamedImports([
                  ts.createImportSpecifier(void 0, ts.createIdentifier('createProxy')),
                  ts.createImportSpecifier(void 0, ts.createIdentifier('scheduler')),
                ])
              ),
              ts.createLiteral('@motorcycle/stream')
            ),
            node,
          ]
        }

        return node
      }

      function addImportSpecifiersVisitor(node: ts.Node): ts.Node {
        checker.getTypeAtLocation(node)

        if (ts.isImportDeclaration(node) && isStreamImport(node, sourceFile)) {
          const { importClause: { namedBindings } } = node
          const { elements } = namedBindings as ts.NamedImports

          const specifiers: Array<ts.ImportSpecifier> = [...elements]

          const hasProxyImport = elements.some(n => n.getText().indexOf('createProxy') > -1)
          const hasSchedulerImport = elements.some(n => n.getText().indexOf('scheduler') > -1)

          if (!hasProxyImport) {
            specifiers.push(ts.createImportSpecifier(void 0, ts.createIdentifier('createProxy')))
          }
          if (!hasSchedulerImport) {
            specifiers.push(ts.createImportSpecifier(void 0, ts.createIdentifier('scheduler')))
          }

          return ts.createImportDeclaration(
            [],
            node.modifiers,
            ts.createImportClause(void 0, ts.createNamedImports(specifiers)),
            node.moduleSpecifier
          )
        }

        return node
      }
    }
  }
}

function findAllImports(sourceFile: ts.SourceFile, context: ts.TransformationContext) {
  const imports: Array<ts.ImportDeclaration> = []

  ts.visitEachChild(sourceFile, visitor, context)

  function visitor(node: ts.Node) {
    if (ts.isImportDeclaration(node)) imports.push(node)

    return node
  }

  return imports
}

function fileHasStreamImport(
  imports: Array<ts.ImportDeclaration>,
  sourceFile: ts.SourceFile
): boolean {
  return imports.some(node => isStreamImport(node, sourceFile))
}

function isStreamImport(node: ts.ImportDeclaration, sourceFile: ts.SourceFile): boolean {
  const text = sourceFile.text.substring(node.getStart(sourceFile), node.getEnd())

  return text.indexOf('@motorcycle/stream') > -1
}
