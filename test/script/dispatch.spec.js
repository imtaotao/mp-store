import { isError } from '../utils'
import { createStore } from '../../src/index'

let store

beforeEach(() => {
  store = createStore()
})

describe('dispatch', () => {
  it('store state cannot be changed', () => {
    store.add('testAction', {
      partialState: {
        a: 1,
      },
    })
    expect(Object.keys(store.state).length).toBe(1)
    expect(store.state.a).toBe(1)
    const fn = () => store.state.a = 2
    expect(isError(fn)).toBeTruthy()
  })

  it('error when `action` does not exist', () => {
    store.add('testActionOne', {
      partialState: {},
    })
    const fn = () => store.dispatch('testActionTwo')
    expect(isError(fn)).toBeTruthy()
  })

  it('can\'t call dispatch in dispatch processing', () => {
    store.add('testActionOne', {
      partialState: {},
      setter () {
        const fn = () => store.dispatch('testActionTwo')
        expect(isError(fn)).toBeTruthy()
        return {}
      },
    })
    store.add('testActionTwo', {
      partialState: {},
      setter: () => ({}),
    })
    store.dispatch('testActionOne')
  })

  it('allow call dispatch in update callback', () => {
    let i = 0
    store.add('testAction', {
      partialState: {},
      setter (state, payload) {
        i += payload
        return {}
      },
    })
    store.dispatch('testAction', 1, () => {
      store.dispatch('testAction', 2)
    })
    expect(i).toBe(3)
  })

  it('allow add new middleware in update callback', () => {
    let i = 0
    store.add('testAction', {
      partialState: {},
      setter (state, payload) {
        expect(payload).toBeNull()
        return {}
      },
    })
    expect(store.middleware.stack.length).toBe(0)
    store.dispatch('testAction', null, () => {
      store.use((payload, next) => {
        i++
        next(payload)
      })
      // no call `next`, so only need expect null
      store.use('testAction', (payload, next) => { i++ })
      expect(store.middleware.stack.length).toBe(2)
      store.dispatch('testAction')
    })
    expect(store.middleware.stack.length).toBe(2)
    expect(i).toBe(2)
  })

  it('allow call dispatch again in the middleware', done => {
    let i = 0
    store.add('testActionOne', {
      partialState: {},
      setter (state, payload) {
        expect(i++).toBe(4)
        expect(Object.keys(state).length).toBe(1)
        expect(payload).toBe(10)
        done()
        return {}
      },
    })
    store.add('testActionTwo', {
      partialState: {},
      setter (state, payload) {
        expect(i++).toBe(2)
        expect(Object.keys(state).length).toBe(0)
        expect(payload).toBe(2)
        return { a: 1 }
      },
    })
    store.use('testActionOne', (payload, next) => {
      expect(i++).toBe(1)
      expect(payload).toBe(1)
      setTimeout(() => {
        next(payload * 10)
      })
      store.dispatch('testActionTwo', 2)
    })
    expect(i++).toBe(0)
    store.dispatch('testActionOne', 1)
    expect(i++).toBe(3)
  })

  it('dispatch `callback` after the component is updated', done => {
    const obj = {
      callback () {
        expect(Object.keys(store.state).length).toBe(1)
        expect(store.state.a).toBe(1)
      }
    }
    spyOn(obj, 'callback')
    store.add('testAction', {
      partialState: {},
      setter (state, payload) {
        expect(payload).toBeNull()
        setTimeout(() => {
          expect(obj.callback).toHaveBeenCalled()
          expect(obj.callback).toHaveBeenCalledWith()
          done()
        })
        return { a: 1 }
      },
    })
    store.use('testAction', (payload, next) => {
      expect(payload).toBeNull()
      setTimeout(() => next(payload))
    })
    store.dispatch('testAction', null, obj.callback)
    expect(Object.keys(store.state).length).toBe(0)
    expect(store.state.a).toBeUndefined()
  })

  it('component data update', done => {
    store.add('testAction', {
      partialState: {
        name: 'tao',
      },
      setter (state, payload) {
        return { name: payload }
      },
    })
    throw Component.toString()
    const cmOneId = simulate.load(Component({
      template: '<div>{{ global.name }}</div>',
      storeConfig: {
        usedGlobalState (_store) {
          throw 'aa' + JSON.stringify(_store.state) + JSON.stringify(store.state)
          expect(store === _store).toBeTruthy()
          expect(this === _store).toBeTruthy()
          return { name: state => state.name }
        },
      },
      methods: {
        changed () {
          store.dispatch('testAction', 'taotao')
        },
      },
    }))
    const cmTwoId = simulate.load(Component({
      template: '<div>{{ global.name }}</div>',
      storeConfig: {
        usedGlobalState (_store) {
          expect(store === _store).toBeTruthy()
          expect(this === _store).toBeTruthy()
          return { name: state => state.name }
        },
      },
      methods: {
        changed () {
          store.dispatch('testAction', 'imtaotao')
        },
      },
    }))
    const parent = document.createElement('parent-wrapper')
    const cmOne = simulate.render(cmOneId)
    const cmTwo = simulate.render(cmTwoId)
    cmOne.attach(parent)
    cmTwo.attach(parent)
    setTimeout(() => {
      // expect(cmOne.instance.data.global.name).toBe('tao')
      // expect(cmTwo.instance.data.global.name).toBe('tao')
      // expect(cmOne.dom.innerHTML).toBe('<div>tao</div>')
      // expect(cmTwo.dom.innerHTML).toBe('<div>tao</div>')
      done()
    }, 100)
  })
})