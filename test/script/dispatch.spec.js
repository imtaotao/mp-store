import { isError } from '../utils'
import createStore from '../../src/index'

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
})