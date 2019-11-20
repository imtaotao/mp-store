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

  it('when namespace is an empty string, it is equivalent to in the global module.', () => {
    store.add('one', {
      namespace: '',
      partialState: {
        a: 1,
      },
      setter (state, payload, rootState) {
        expect(state).toBe(store.state)
        expect(state).toBe(rootState)
        return { a: payload }
      },
    })
    expect(isModule(store.state)).toBeTruthy()
    expect(Object.keys(store.state).length).toBe(1)
    expect(store.state.a).toBe(1)
    store.dispatch('one', 2)
    expect(store.state.a).toBe(2)
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

  it(
    'in the object returned by the setter function, if the submodule is changed, ' +
    'it must be the same module, and cannot be changed to other values (the module has higher priority), otherwise an error is reported',
    () => {
      store.add('one', {
        partialState: {
          a: createModule({}),
          b: 1,
        },
        setter: (state, payload) => payload
      })
      const fn = () => {
        store.dispatch('one', {
          a: {},
          b: 3,
        })
      }
      expect(store.state.b).toBe(1)
      expect(isError(fn)).toBeTruthy()
      expect(store.state.b).toBe(1)
      store.dispatch('one', {
        a: createModule({}),
        b: 2,
      })
      expect(store.state.b).toBe(2)
      expect(store.state.a).toEqual({})
      expect(isModule(store.state.a)).toBeTruthy()
    },
  )

  it(
    'In the object returned by the setter function, if the submodule is changed, it must be the same module, ' +
    'cannot be changed to other values (the module has higher priority), and the recursive merge submodule is merged',
    () => {
      store.add('one', {
        partialState: {
          a: createModule({}),
          b: 1,
        },
        setter: (state, payload) => payload
      })
      store.dispatch('one', {
        a: createModule({
          name: 'tao',
        }),
        b: 2,
      })
      expect(store.state.b).toBe(2)
      expect(store.state.a.name).toBe('tao')
      expect(isModule(store.state.a)).toBeTruthy()
    },
  )

  it('cannot create a new module in the object returned by the setter function', () => {
    store.add('one', {
      partialState: {
        a: createModule({}),
        b: 1,
      },
      setter: (state, payload) => payload
    })
    const one = () => {
      store.dispatch('one', {
        c: createModule({})
      })
    }
    const two = () => {
      store.dispatch('one', {
        a: createModule({
          c: createModule({})
        })
      })
    }
    const three = () => {
      store.dispatch('one', {
        a: createModule({
          c: 'tao'
        })
      })
    }
    expect(isError(one)).toBeTruthy()
    expect(isError(two)).toBeTruthy()
    expect(isError(three)).toBeFalsy()
    expect(isModule(store.state.a)).toBeTruthy()
    expect(store.state.a.c).toBe('tao')
  })

  it('the object returned by the setter function acts on the module defined by the current namespace', () => {
    store.add('one', {
      namespace: 'a.b',
      partialState: {
        i: 1,
      },
      setter: (state, payload) => ({
        i: payload,
      })
    })
    store.add('two', {
      namespace: 'a',
      partialState: {
        name: 'tao',
      }
    })
    recursiveInspect(store.state, 'a.b')
    expect(store.state.a.b.i).toBe(1)
    expect(store.state.a.name).toBe('tao')
    store.dispatch('one', 2)
    expect(store.state.a.b.i).toBe(2)
    expect(store.state.a.name).toBe('tao')
    store.dispatch('one', 3)
    expect(store.state.a.b.i).toBe(3)
    expect(store.state.a.name).toBe('tao')
  })

  it('inpect setter function params', () => {
    store.add('one', {
      partialState: {
        a: 1,
      },
      setter (state, payload, rootState) {
        expect(isModule(state)).toBeTruthy()
        expect(payload).toBe(2)
        expect(rootState).toBeUndefined()
        return { a: payload }
      },
    })
    store.dispatch('one', 2)
    expect(store.state.a).toBe(2)
    expect(store.state.b).toBeUndefined()
    store.add('two', {
      namespace: 'b',
      partialState: {
        a: 1,
      },
      setter (state, payload, rootState) {
        expect(isModule(state)).toBeTruthy()
        expect(state).toEqual({ a: 1 })
        expect(payload).toBe(2)
        expect(rootState).toBe(store.state)
        return { a: payload }
      },
    })
    expect(store.state.a).toBe(2)
    expect(store.state.b.a).toBe(1)
    store.dispatch('two', 2)
    expect(store.state.a).toBe(2)
    expect(store.state.b.a).toBe(2)
  })

  it('[one] when a multi-level module is associated with a view', () => {
    const store = createStore()
    store.add('one', {
      partialState: {
        name: 'chen',
      },
      setter (state, payload) {
        return {
          name: payload,
          a: createModule({
            age: 20,
          }),
        }
      },
    })
    store.add('two', {
      namespace: 'a.b',
      partialState: {
        sex: 'man',
      },
      setter (state, payload) {
        return  { sex: payload }
      },
    })
    const id = simulate.load(Component({
      template: '<div>{{ global.sex }}-{{ global.name }}-{{ global.age }}</div>',
      storeConfig: {
        useState () {
          return ['a.b', {
            sex: s => s.sex,
            name: (s, r) => r.name,
            age: (s, r) => r.a.age,
          }]
        },
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    const fn = (sex, name, age) => {
      recursiveInspect(store.state, 'a.b')
      expect(store.state.name).toBe(name)
      expect(store.state.a.b.sex).toBe(sex)
      expect(store.state.a.age).toBe(age)
      expect(cm.dom.textContent).toBe(`${sex}-${name}-${age || ''}`)
    }
    fn('man', 'chen', undefined)
    store.dispatch('one', 'imtaotao')
    fn('man', 'imtaotao', 20)
    store.dispatch('two', 'women')
    fn('women', 'imtaotao', 20)
  })

  it('[two] when a multi-level module is associated with a view', () => {
    const store = createStore()
    store.add('one', {
      partialState: {
        name: 'chen',
      },
      setter: (state, payload) => ({ name: payload })
    })
    store.add('two', {
      namespace: 'a',
      partialState: {
        age: 0,
      },
      setter: (state, payload) => ({ age: payload })
    })
    store.add('three', {
      namespace: 'a.b',
      partialState: {
        sex: 'man',
      },
      setter: (state, payload) => ({ sex: payload })
    })
    const id = simulate.load(Component({
      template: '<div>{{ global.sex }}-{{ global.name }}-{{ global.age }}</div>',
      storeConfig: {
        useState () {
          return ['a.b', {
            sex: s => s.sex,
            name: (s, r) => r.name,
            age: (s, r) => r.a.age,
          }]
        },
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    const fn = (sex, name, age) => {
      recursiveInspect(store.state, 'a.b')
      expect(store.state.name).toBe(name)
      expect(store.state.a.b.sex).toBe(sex)
      expect(store.state.a.age).toBe(age)
      expect(cm.dom.textContent).toBe(`${sex}-${name}-${age}`)
    }
    fn('man', 'chen', 0)
    store.dispatch('one', 'imtaotao')
    fn('man', 'imtaotao', 0)
    store.dispatch('two', 20)
    fn('man', 'imtaotao', 20)
    store.dispatch('three', 'women')
    fn('women', 'imtaotao', 20)
  })

  it('when linked with `middleware`', () => {
    store.add('one', {
      namespace: 'a.b',
      partialState: {
        i: 1,
      },
      setter: (state, payload) => ({ i: payload })
    })
    store.add('two', {
      namespace: 'a',
      partialState: {
        n: 2,
      },
      setter: (state, payload) => ({ n: payload }),
    })
    store.use('one', (payload, next) => {
      expect(payload).toBe(3)
      next(payload * 10)
    })
    store.use('two', (payload, next) => {
      expect(payload).toBe(4)
      next(payload * 10)
    })
    store.use((payload, next) => {
      if (payload / 10 % 2 === 0) {
        expect(payload).toBe(40)
      } else {
        expect(payload).toBe(30)
      }
      next(payload)
    })
    recursiveInspect(store.state, 'a.b')
    expect(store.state.a.n).toBe(2)
    expect(store.state.a.b.i).toBe(1)
    store.dispatch('one', 3)
    expect(store.state.a.n).toBe(2)
    expect(store.state.a.b.i).toBe(30)
    store.dispatch('two', 4)
    expect(store.state.a.n).toBe(40)
    expect(store.state.a.b.i).toBe(30)
  })

  it('when linked with `timeTravel`', () => {
    const store = createStore()
    store.add('one', {
      partialState: {
        name: 'chen',
      },
      setter: (state, payload) => ({ name: payload })
    })
    store.add('two', {
      namespace: 'a',
      partialState: {
        age: 0,
      },
      setter: (state, payload) => ({ age: payload })
    })
    store.add('three', {
      namespace: 'a.b',
      partialState: {
        sex: 'man',
      },
      setter: (state, payload) => ({ sex: payload })
    })
    const id = simulate.load(Component({
      template: '<div>{{ global.sex }}-{{ global.name }}-{{ global.age }}</div>',
      storeConfig: {
        travelLimit: 5,
        useState () {
          return ['a.b', {
            sex: s => s.sex,
            name: (s, r) => r.name,
            age: (s, r) => r.a.age,
          }]
        },
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    const fn = (sex, name, age) => {
      recursiveInspect(store.state, 'a.b')
      expect(store.state.name).toBe(name)
      expect(store.state.a.b.sex).toBe(sex)
      expect(store.state.a.age).toBe(age)
      expect(cm.data.global.sex).toBe(sex)
      expect(cm.data.global.age).toBe(age)
      expect(cm.data.global.name).toBe(name)
      expect(cm.dom.textContent).toBe(`${sex}-${name}-${age}`)
    }
    fn('man', 'chen', 0)
    store.dispatch('one', 'imtaotao')
    fn('man', 'imtaotao', 0)
    store.dispatch('two', 20)
    fn('man', 'imtaotao', 20)
    store.dispatch('three', 'women')
    fn('women', 'imtaotao', 20)
    const fnTwo = (sex, name, age) => {
      recursiveInspect(store.state, 'a.b')
      expect(store.state.name).toBe('imtaotao')
      expect(store.state.a.b.sex).toBe('women')
      expect(store.state.a.age).toBe(20)
      expect(cm.data.global.sex).toBe(sex)
      expect(cm.data.global.age).toBe(age)
      expect(cm.data.global.name).toBe(name)
      expect(cm.dom.textContent).toBe(`${sex}-${name}-${age}`)
    }
    const timeTravel = cm.instance.timeTravel
    timeTravel.back()
    fnTwo('man', 'imtaotao', 20)
    timeTravel.forward()
    fnTwo('women', 'imtaotao', 20)
    timeTravel.go(-1)
    fnTwo('man', 'imtaotao', 20)
    timeTravel.go(-1)
    fnTwo('man', 'imtaotao', 0)
    timeTravel.back()
    fnTwo('man', 'chen', 0)
    timeTravel.back()
    fnTwo('man', 'chen', 0)
    timeTravel.toEnd()
    fnTwo('women', 'imtaotao', 20)
    timeTravel.toStart()
    fnTwo('man', 'chen', 0)
    store.dispatch('two', 22)
    fn('women', 'imtaotao', 22)
  })
})