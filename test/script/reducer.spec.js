import { isError } from '../utils'
import createStore from '../../src/index'

let store

beforeEach(() => {
  store = createStore()
})

describe('Reducer', () => {
  it('inspect action type', () => {
    const one = () => {
      store.add('testAction', { partialState: {} })
    }
    const two = () => {
      store.add(Symbol(), { partialState: {} })
    }
    const three = () => {
      store.add(null, { partialState: {} })
    }
    expect(isError(one)).toBeFalsy()
    expect(isError(two)).toBeFalsy()
    expect(isError(three)).toBeTruthy()
  })

  it('the action is only', () => {
    const s = Symbol()
    const one = () => {
      store.add(s,  { partialState: {} })
    }
    const two = () => {
      store.add(Symbol(),  { partialState: {} })
    }
    const three = () => {
      store.add(s,  { partialState: {} })
    }
    expect(isError(one)).toBeFalsy()
    expect(isError(two)).toBeFalsy()
    expect(isError(three)).toBeTruthy()
  })

  it('the namespace must be a string', () => {
    const one = () => {
      store.add('testActionOne',  {
        namespace: '',
        partialState: {},
      })
    }
    const two = () => {
      store.add('testActionTwo',  {
        namespace: null,
        partialState: {},
      })
    }
    expect(isError(one)).toBeFalsy()
    expect(isError(two)).toBeTruthy()
  })

  it('no need `partialState` word', () => {
    const fn = () => store.add('testAction', {
      partialState: {},
    })
    expect(isError(fn)).toBeFalsy()
  })

  it('[error] no need `partialState` word', () => {
    const fn = () => store.add('testAction', {
      _partialState: {},
    })
    expect(isError(fn)).toBeFalsy()
  })

  it('partialState is plain object', () => {
    const fn = () => store.add('testAction', {
      partialState: {},
    })
    expect(isError(fn)).toBeFalsy()
  })

  it('[error] partialState is plain object', () => {
    const one = () => store.add('testAction', {
      partialState: null,
    })
    const two = () => store.add('testAction', {
      partialState: Object.create({}),
    })
    expect(isError(one)).toBeTruthy()
    expect(isError(two)).toBeTruthy()
  })

  it('can\'t defined repeat word', () => {
    store.add('testAction', {
      partialState: { a: 1 },
    })
    const fn = () => store.add('testAction', {
      partialState: { a: 2 },
    })
    expect(isError(fn)).toBeTruthy()
  })

  it('`partialState` will only evaluate to an empty object if it has a value of type symbol', () => {
    const s = Symbol()
    store.add('actionOne', {
      partialState: {
        [Symbol()]: 1,
        [Symbol()]: 2
      },
    })
    expect(store.state).toEqual({})
    expect(Object.keys(store.state).length).toBe(0)
    // the Symbol('module') must exist
    expect(Reflect.ownKeys(store.state).length).toBe(1)
    store.add('actionTwo', {
      partialState: {
        [s]: 1,
        [s]: 2
      },
    })
    expect(store.state).toEqual({})
    expect(Object.keys(store.state).length).toBe(0)
    // the Symbol('module') must exist
    expect(Reflect.ownKeys(store.state).length).toBe(1)
    store = createStore()
    const fn = () => {
      store.add('actionThree', {
        partialState: {
          [s]: 1,
          [s]: 2,
          a: 1,
        },
      })
    }
    expect(isError(fn)).toBeFalsy()
    expect(Object.keys(store.state).length).toBe(1)
    // [a, Symbol(), Symbol('module') ]
    expect(Reflect.ownKeys(store.state).length).toBe(3)
  })

  it('default setter function', () => {
    const reducer = {
      partialState: {},
    }
    store.add('testAction', reducer)
    expect(typeof reducer.setter).toBe('function')
    expect(isError(reducer.setter)).toBeTruthy()
  })

  it('no default setter function', () => {
    const reducer = {
      setter () {},
      partialState: {},
    }
    store.add('testAction', reducer)
    expect(typeof reducer.setter).toBe('function')
    expect(isError(reducer.setter)).toBeFalsy()
  })

  it('inspect setter function accept params', done => {
    store.add('testAction', {
      partialState: {},
      setter (state, payload) {
        expect(arguments.length).toBe(2)
        expect(state).toBe(store.state)
        expect(payload).toBe(1)
        done()
        return {}
      },
    })
    setTimeout(() => {
      store.dispatch('testAction', 1)
    })
  })

  it('setter function should return plain object', () => {
    store.add('testAction', {
      partialState: {
        a: 1,
      },
      setter (state, payload) {
        expect(state.a).toBe(1)
        expect(payload).toBeUndefined()
        return {
          a: 3,
          b: 4,
        }
      },
    })
    store.dispatch('testAction')
    expect(store.state.a).toBe(3)
    expect(store.state.b).toBe(4)
  })

  it('[error] setter function should return plain object', () => {
    store.add('testAction', {
      setter () {},
      partialState: {},
    })
    const fn = () => store.dispatch('testAction')
    expect(isError(fn)).toBeTruthy()
  })

  it('can\'t add the same `action` repeatedly', () => {
    store.add('testAction', {
      partialState: {},
    })
    const fn = () => {
      store.add('testAction', {
        partialState: {},
      })
    }
    expect(isError(fn)).toBeTruthy()
  })

  it('store id is a unique', () => {
    const prevId = store
      ? store.id
      : 0
    const arr = new Array(parseInt(Math.random() * 100))
    const inspect = i => {
      const len = i
      const current = arr[len]
      expect(current.id - prevId).toBe(len + 1)
      while(--i > -1) {
        expect(arr[i].id + (len - i)).toBe(current.id)
      }
    }
    for (let i = 0; i < arr.length; i++) {
      arr[i] = createStore()
      inspect(i)
    }
  })
})