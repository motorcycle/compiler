# @motorcycle/compiler

## Get It
```sh
npm install --save @motorcycle/compiler
# or
yarn add @motorcycle/compiler
```

## API

<details>
  <summary id=compile>compile(filePath: string): string</summary>
  <p>Takes the entry file to your Motorcycle run function away using<br>type information from the TypeScript compiler.</p>


  <p><strong>Example:</strong></p>

```typescript
import { compile } from '@motorcycle/compiler'
import * as fs from 'fs'

const filePath = './src/bootstrap.ts'

fs.writeFileSync(filePath, compile(filePath))
```

</details>
