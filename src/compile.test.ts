import { Test, describe, given, it } from '@typed/test'

import { compile } from './compile'

export const test: Test = describe(`compile`, [
  given(`a path to bootstrap file`, [
    it(`returns javascript source code`, ({ equal }) => {
      const path = 'src/__test__/bootstrap.ts'

      const expected = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var stream_1 = require("@motorcycle/stream");
var mostly_dom_1 = require("@motorcycle/mostly-dom");
var UI_1 = require("./UI");
var element = document.querySelector('#app');
if (!element)
    throw new Error('could not find element');
var sinkProxies__generated__by__motorcycle__compiler = {
    view$: stream_1.createProxy().stream
};
var sources__generated__by__motorcycle__compiler = mostly_dom_1.makeDomComponent(element)(sinkProxies__generated__by__motorcycle__compiler);
var sinks__generated__by__motorcycle__compiler = UI_1.UI(sources__generated__by__motorcycle__compiler);
sinks__generated__by__motorcycle__compiler.view$.run(sinkProxies__generated__by__motorcycle__compiler.view$, stream_1.scheduler);
//# sourceMappingURL=module.js.map`

      equal(expected, compile(path))
    }),
  ]),
])
