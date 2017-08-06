import { DomSinks, DomSources, button, div, h1 } from '@motorcycle/mostly-dom'
import { constant, map, merge, scan } from '@motorcycle/stream'
import { events, query } from '@motorcycle/dom'

const click = events('click')
const INCREMENT_SELECTOR = '#increment'
const DECREMENT_SELECTOR = '#decrement'

const add = (x: number, y: number) => x + y

export function UI(sources: DomSources): DomSinks {
  const { dom } = sources
  const increment$ = constant(+1, click(query(INCREMENT_SELECTOR, dom)))
  const decrement$ = constant(-1, click(query(DECREMENT_SELECTOR, dom)))
  const amount$ = scan(add, 0, merge(increment$, decrement$))
  const view$ = map(view, amount$)

  return { view$ }
}

function view(amount: number) {
  return div([
    h1(`Count: ${amount}`),
    button(INCREMENT_SELECTOR, `Increment +`),
    button(DECREMENT_SELECTOR, `Decrement -`),
  ])
}
