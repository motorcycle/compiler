import * as ts from 'typescript'

export type TransformFactoryFactory = (program: ts.Program) => ts.TransformerFactory<ts.Node>
