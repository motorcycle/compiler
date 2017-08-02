import * as fs from 'fs'
import * as yargs from 'yargs'

import { compile } from './compile'

const args: any = yargs
  .usage(`\n$0 path/to/file\n` + `  -out -o :: where to output your compiled file`)
  .option('out', { alias: 'o', requiresArg: true })
  .showHelpOnFail(true)

if (args.help) {
  args.showHelp()
} else if (args.out) {
  fs.writeFileSync(args.out, compile(args._[0]))
} else {
  console.log(compile(args._[0]))
}
