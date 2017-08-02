import * as fs from 'fs'
import * as ts from 'typescript'

import { removeRunImport, replaceRunCall } from './transformers'

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
  },
  cwd
)

export function compile(filePath: string) {
  const program = ts.createProgram([filePath], options)
  const sourceFiles = program.getSourceFiles().filter(sf => !sf.isDeclarationFile)

  const { diagnostics, transformed } = ts.transform(
    sourceFiles,
    [removeRunImport(program), replaceRunCall(program)],
    options
  )

  if (diagnostics && diagnostics.length) {
    console.log(
      yellow(`
      ======================= Diagnostics for ${filePath} =======================
      `)
    )
    for (const diag of diagnostics) {
      if (diag.file && diag.start) {
        const pos = diag.file.getLineAndCharacterOfPosition(diag.start)
        console.log(`(${pos.line}, ${pos.character}) ${diag.messageText}`)
      }
    }
  }

  const printer = ts.createPrinter()

  const sourceFile = program.getSourceFile(filePath)

  const [transformedFile] = (transformed as Array<ts.SourceFile>).filter(file => {
    const expectedFilePath = filePath.endsWith('.ts') ? filePath : filePath + '.ts'

    return file.fileName === expectedFilePath || file.fileName === expectedFilePath.slice(2)
  })

  return printer.printNode(ts.EmitHint.SourceFile, transformedFile, sourceFile)
}
