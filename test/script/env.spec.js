import { isError } from '../utils'
import createStore from '../../src/index'

let store

beforeEach(() => {
  store = createStore(null, null, {
    env: 'product'
  })
})

describe('Env', () => {
  it('no inspect module attrs', () => {
    const fn = () => {
      store.add('one', {
        namespace: 'a',
        partialState: {
          a: 1,
        },
      })
      store.add('two', {
        namespace: 'a',
        partialState: {
          a: 2,
        },
      })
    }
    expect(isError(fn)).toBeFalse()
  })

  it('no check state attrs', () => {
    store.add('one', {
      partialState: { a: 1 },
    })
    const fn = () => store.add('two', {
      partialState: { a: 2 },
    })
    expect(isError(fn)).toBeFalse()
  })
})