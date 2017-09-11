import * as fs from 'fs'
import * as ts from 'typescript'

import { addMissingImports, removeRunImport, replaceRunCall } from './transformers'

import { yellow } from 'typed-colors'

const cwd = process.cwd()

const configPath = ts.findConfigFile(cwd, (fileName: string) => fs.existsSync(fileName))

const { config: { compilerOptions } } = ts.parseConfigFileTextToJson(
  configPath,
  fs.readFileSync(configPath).toString()
)

const { options } = ts.convertCompilerOptionsFromJson(
  {
    ...compilerOptions,
    module: 'commonjs',
    target: 'es5',
    noEmit: false,
    noEmitOnError: true,
    sourceMap: true,
  },
  cwd
)

/**
 * Takes the entry file to your Motorcycle run function away using
 * type information from the TypeScript compiler.
 * 
 * @name compile(filePath: string): string
 * @example
 * import { compile } from '@motorcycle/compiler'
 * import * as fs from 'fs'
 * 
 * const filePath = './src/bootstrap.ts'
 * 
 * fs.writeFileSync(filePath, compile(filePath))
 */
export function compile(filePath: string): { code: string; sourceMap: string } {
  const program = ts.createProgram([filePath], options)
  const sourceFiles = program.getSourceFiles().filter(sf => !sf.isDeclarationFile)

  const { diagnostics, transformed } = ts.transform(
    sourceFiles,
    [removeRunImport(program), addMissingImports(program), replaceRunCall(program)],
    options
  )

  logDiagnostics(filePath, diagnostics)

  const printer = ts.createPrinter()

  const sourceFile = program.getSourceFile(filePath)

  const [transformedFile] = (transformed as Array<ts.SourceFile>).filter(file => {
    const expectedFilePath = filePath.endsWith('.ts') ? filePath : filePath + '.ts'

    return file.fileName === expectedFilePath || file.fileName === expectedFilePath.slice(2)
  })

  const sourceCode = printer.printNode(ts.EmitHint.SourceFile, transformedFile, sourceFile)

  const {
    outputText: code,
    sourceMapText: sourceMap,
    diagnostics: jsDiagnostics,
  } = ts.transpileModule(sourceCode, {
    compilerOptions: options,
  })

  logDiagnostics(filePath, jsDiagnostics)

  return { code, sourceMap }
}

function logDiagnostics(filePath: string, diagnostics: Array<ts.Diagnostic>) {
  if (diagnostics && diagnostics.length) {
    console.log(
      yellow(`
      ======================= Diagnostics for ${filePath} =======================
      `)
    )
    for (const { file, start, messageText } of diagnostics) {
      if (file && start) {
        const { line, character } = file.getLineAndCharacterOfPosition(start)
        console.log(`(${line}, ${character}) ${messageText}`)
      }
    }
  }
}
