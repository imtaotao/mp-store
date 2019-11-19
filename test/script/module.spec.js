import { isError } from '../utils'
import { MODULE_FLAG } from '../../src/module'
import createStore, { isModule, createModule } from '../../src/index'

let store

beforeEach(() => {
  store = createStore()
})

const recursiveInspect = (state, namespace) => {
  let obj = state
  const segments = namespace.split('.')
  for (let i = 0; i < segments.length; i++) {
    const module = obj[segments[i]]
    expect(isModule(module)).toBeTruthy()
    obj = module
  }
}

describe('Module', () => {
  it('global state is module', () => {
    expect(isModule(store.state)).toBeTruthy()
  })

  it('moudle can be created by `createModule`', () => {
    store.add('testAction', {
      partialState: {
        a: createModule({
          aa: createModule({}),
          bb: { [Symbol('module')]: true },
        }),
        b: { [Symbol('module')]: true },
      },
    })
    recursiveInspect(store.state, 'a.aa')
    expect(isModule(store.state.b)).toBeFalsy()
    expect(isModule(store.state.a.bb)).toBeFalsy()
  })

  it('moudle can be created by `namespace`', () => {
    store.add('one', {
      namespace: 'a',
      partialState: {},
    })
    expect(isModule(store.state.a)).toBeTruthy()
    store.add('two', {
      namespace: 'b',
      partialState: {},
    })
    expect(isModule(store.state.b)).toBeTruthy()
    store.add('three', {
      namespace: 'a.a',
      partialState: { a: 1 },
    })
    expect(isModule(store.state.a.a)).toBeTruthy()
    store.add('four', {
      namespace: 'a.a',
      partialState: { b: 2 },
    })
    expect(store.state.a.a.a).toBe(1)
    expect(store.state.a.a.b).toBe(2)
  })

  it('module can be nested', () => {
    store.add('one', {
      partialState: {
        a: createModule({
          aa: createModule({}),
        }),
      },
    })
    store.add('two', {
      namespace: 'a.aa.aaa',
      partialState: {},
    })
    recursiveInspect(store.state, 'a.aa.aaa')
  })

  it('when odule is nested, the parent object must be module', () => {
    store.add('two', {
      namespace: 'a.a.a',
      partialState: {},
    })
    recursiveInspect(store.state, 'a.a.a')
  })

  it('if the created module namespace is occupied in the parent module (but not the module)', () => {
    const fn = () => {
      store.add('one', {
        partialState: {
          a: {},
        },
      })
      store.add('two', {
        namespace: 'a',
        partialState: {},
      })
    }
    expect(isError(fn)).toBeTruthy()
  })

  it('if the created module namespace is occupied in the parent module (but when it is occupied by module)', () => {
    store.add('one', {
      partialState: {
        a: createModule({
          a: 1,
        }),
      },
    })
    store.add('two', {
      namespace: 'a',
      partialState: {
        b: 2,
      },
    })
    store.add('three', {
      namespace: 'b',
      partialState: {
        a: 1,
      },
    })
    store.add('four', {
      namespace: 'b',
      partialState: {
        b: 2,
      },
    })
    expect(isModule(store.state.a)).toBeTruthy()
    expect(isModule(store.state.b)).toBeTruthy()
    expect(store.state.a.a).toBe(1)
    expect(store.state.a.b).toBe(2)
    expect(store.state.b.a).toBe(1)
    expect(store.state.b.b).toBe(2)
  })

  it(
    'if the created module namespace is occupied in the parent module (but the module is occupied), ' +
    'then merge, merge with the same sub-namespace, then report an error (that is, you cannot repeatedly define the same field)',
    () => {
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
      expect(isError(fn)).toBeTruthy()
    }
  )

  it('if a module is created by namespace and the parent object does not exist, a new empty parent module is created by default', () => {
    const namespace = 'a.b.c.d.e.f.g.h'
    store.add('one', {
      namespace,
      partialState: {
        a: 1,
      },
    })
    recursiveInspect(store.state, namespace)
    expect(store.state.a.b.c.d.e.f.g.h).toEqual({ a: 1 })
  })

  it('if the module is created by namespace, the parent object exists, but not a module, then an error is reported', () => {
    const fn = () => {
      store.add('one', {
        partialState: {
          a: {},
        }
      })
      store.add('two', {
        namespace: 'a.b',
        partialState: {},
      })
    }
    expect(isError(fn)).toBeTruthy()
  })

  it('if a module is created by a namespace and a parent object exists when it is a module, a new submodule is created in it', () => {
    store.add('one', {
      partialState: {
        a: createModule({}),
      }
    })
    store.add('two', {
      namespace: 'a.b',
      partialState: {
        a: 1,
      },
    })
    recursiveInspect(store.state, 'a.b')
    expect(store.state.a.b.a).toBe(1)
  })

  it('[addModule] inspect params', () => {
    const one = () => store.addModule(null, {})
    const two = () => store.addModule('a', {
      'aa': {}
    })
    expect(isError(one)).toBeTruthy()
    expect(isError(two)).toBeTruthy()
    store.addModule('a', {
      'aa': {
        partialState: {
          name: 'tao',
        }
      },
      'bb': {
        partialState: {
          nameTwo: 'imtaotao',
        }
      }
    })
    expect(isModule(store.state.a)).toBeTruthy()
    expect(Object.keys(store.state.a).length).toBe(2)
    expect(store.state.a.name).toBe('tao')
    expect(store.state.a.nameTwo).toBe('imtaotao')
  })

  it('[addModule] allow symbol and string as keys', () => {
    const s = Symbol()
    store.addModule('a', {
      [s]: {
        partialState: {
          name: 'tao',
        }
      },
      'bb': {
        partialState: {
          nameTwo: 'imtaotao',
        }
      }
    })
    expect(isModule(store.state.a)).toBeTruthy()
    expect(Object.keys(store.state.a).length).toBe(2)
    expect(store.state.a.name).toBe('tao')
    expect(store.state.a.nameTwo).toBe('imtaotao')
    expect(store.reducers.length).toBe(2)
    expect(store.reducers[0].action).toBe('bb')
    expect(store.reducers[1].action).toBe(s)
  })

  it('[addModule] add a key of type `string` first, then add a key of type `symbol`', () => {
    const sOne = Symbol()
    const sTwo = Symbol()
    store.addModule('a', {
      [sOne]: {
        partialState: {
          name: 'tao',
        }
      },
      'bb': {
        partialState: {
          nameTwo: 'imtaotao',
        }
      },
      [sTwo]: {
        partialState: {}
      }
    })
    expect(store.reducers.length).toBe(3)
    expect(store.reducers[0].action).toBe('bb')
    expect(typeof store.reducers[1].action).toBe('symbol')
    expect(typeof store.reducers[2].action).toBe('symbol')
  })

  it('[addModule] the default is to call the `store.add` method.', () => {
    spyOn(store, 'add')
    const reducer = {
      partialState: {
        name: 'tao',
      },
    }
    store.addModule('a', {
      'aa': reducer,
    })
    expect(store.add).toHaveBeenCalledWith('aa', reducer)
  })

  it('[getModule] inspect the type of namespace', () => {
    store.add('action', {
      partialState: {
        a: createModule({ a: 1 }),
      }
    })
    const fn = () => {
      store.getModule(null)
    }
    expect(isError(fn)).toBeTruthy()
    expect(isModule(store.getModule('a'))).toBeTruthy()
    expect(store.getModule('a')).toEqual({ a: 1 })
  })

  it('[getModule] if no namespace returns global state', () => {
    store.add('action', {
      partialState: {
        a: createModule({}),
      }
    })
    expect(isModule(store.getModule(''))).toBeTruthy()
    expect(store.getModule('')).toBe(store.state)
  })

  it('[getModule] if there is remainMsg, it will check if the module exists. If not, it needs to report an error', () => {
    store.add('action', {
      namespace: 'a',
      partialState: {}
    })
    const fn = () => store.getModule('b', true)
    expect(isError(fn)).toBeTruthy()
    expect(isModule(store.getModule('a', true))).toBeTruthy()
  })
  
  it('[createModule] if it is a module itself, return itself', () => {
    const moduleOne = createModule({})
    expect(isModule(moduleOne)).toBeTruthy()
    const moduleTwo = createModule(moduleOne)
    expect(isModule(moduleTwo)).toBeTruthy()
    expect(moduleTwo).toBeTruthy(moduleOne)
  })

  it('[createModule] will add a symbol value as an identifier', () => {
    const moduleOne = createModule({})
    const symbols = Object.getOwnPropertySymbols(moduleOne)
    expect(symbols.length).toBe(1)
    expect(symbols[0]).toBe(MODULE_FLAG)
  })

  it('[createModule] must be a plainObject', () => {
    const one = () => createModule(Object.create({}))
    const two = () => createModule(null)
    expect(isError(one)).toBeTruthy()
    expect(isError(two)).toBeTruthy()
  })

  it('[isModule] must be a plainObject', () => {
    const module = createModule({})
    expect(isModule(module)).toBeTruthy()
    expect(isModule({})).toBeFalsy()
    expect(isModule(null)).toBeFalsy()
    expect(isModule(Object.create({ [MODULE_FLAG]: true }))).toBeFalsy()
  })

  it('[isModule] will check the symbol identifier', () => {
    expect(isModule({ [Symbol('module')]: true })).toBeFalsy()
    expect(isModule({ [MODULE_FLAG]: true })).toBeTruthy()
  })
})