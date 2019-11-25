import createStore from '../../src/index'
import { isError, isRangeTime } from '../utils'
import { COMMONACTION } from '../../src/middleware'

let store

beforeEach(() => {
  store = createStore()
})

const define = action => store.add(action, {
  partialState: {},
  setter: () => ({}),
})

describe('Middleware', () => {
  it('Allow interception of `Symbol` action', () => {
    let i = 0
    let j = 0
    const s = Symbol()
    define(s)
    store.use((payload, next) => {
      i++
      j++
      next()
    })
    store.use(s, (payload, next) => {
      i++
      next()
    })
    store.dispatch(s, () => {
      expect(i).toBe(2)
      expect(j).toBe(1)
    })
  })

  it('no specify action', () => {
    let i = 0
    let j = 0
    define('testActionOne')
    define('testActionTwo')
    store.use('testActionOne', (payload, next) => {
      j++
      expect(payload).toBe(1)
      next(payload * 10)
    })
    store.use('testActionTwo', (payload, next) => {
      j++
      expect(payload).toBe(2)
      next(payload * 10)
    })
    store.use(payload => {
      i++
      if (i === 1) {
        expect(payload).toBe(10)
      } else if (i === 2) {
        expect(payload).toBe(20)
      }
    })
    store.dispatch('testActionOne', 1)
    store.dispatch('testActionTwo', 2)
    expect(i).toBe(2)
    expect(j).toBe(2)
  })

  it('intercept all action', () => {
    let i = 0
    let j = 0
    define('testActionOne')
    define('testActionTwo')
    store.use('testActionOne', (payload, next) => {
      j++
      expect(payload).toBe(1)
      next(payload * 10)
    })
    store.use('testActionTwo', (payload, next) => {
      j++
      expect(payload).toBe(2)
      next(payload * 10)
    })
    store.use(COMMONACTION, payload => {
      i++
      if (i === 1) {
        expect(payload).toBe(10)
      } else if (i === 2) {
        expect(payload).toBe(20)
      }
    })
    expect(COMMONACTION()).toBeUndefined()
    store.dispatch('testActionOne', 1)
    store.dispatch('testActionTwo', 2)
    expect(i).toBe(2)
    expect(j).toBe(2)
  })

  it('inspect the number of middleware', () => {
    define('testActionOne')
    define('testActionTwo')
    store.use(() => {})
    store.use('testActionOne', () => {})
    store.use('testActionTwo', () => {})
    expect(store.middleware.stack.length).toBe(3)
    store.dispatch('testActionOne')
    expect(store.middleware.stack.length).toBe(3)
    store.dispatch('testActionTwo')
    expect(store.middleware.stack.length).toBe(3)
    store.use(() => {})
    expect(store.middleware.stack.length).toBe(4)
  })

  it('can\'t allow new middleware in the middleware processing', () => {
    define('testAction')
    store.use('testAction', () => {
      const one = () => store.use(() => {})
      const two = () => store.use('one', () => {})
      expect(isError(one)).toBeTruthy()
      expect(isError(two)).toBeTruthy()
    })
    store.dispatch('testAction')
    expect(store.middleware.stack.length).toBe(1)
  })

  it('can\'t add middleware in setter function', () => {
    store.add('testAction', {
      partialState: {},
      setter () {
        const one = () => store.use(() => {})
        const two = () => store.use('one', () => {})
        expect(isError(one)).toBeTruthy()
        expect(isError(two)).toBeTruthy()
        return {}
      },
    })
    store.dispatch('testAction')
    expect(store.middleware.stack.length).toBe(0)
  })

  it('return remove function', () => {
    define('testAction')
    const removeOne = store.use(() => {})
    const removeTwo = store.use('one', () => {})
    expect(store.middleware.stack.length).toBe(2)
    expect(store.middleware.stack[0].action).toBe(COMMONACTION)
    expect(store.middleware.stack[1].action).toBe('one')
    removeOne()
    expect(store.middleware.stack.length).toBe(1)
    expect(store.middleware.stack[0].action).toBe('one')
    removeTwo()
    expect(store.middleware.stack.length).toBe(0)
  })

  it('inspect accept params', () => {
    let i = 0
    define('testAction')
    store.use((payload, next, action) => {
      i++
      expect(arguments.length).toBe(3)
      expect(payload).toBeUndefined()
      expect(typeof next).toBe('function')
      expect(action).toBe('testAction')
      next(1)
    })
    store.use('testAction', (payload, next, action) => {
      i++
      expect(arguments.length).toBe(3)
      expect(payload).toBe(1)
      expect(typeof next).toBe('function')
      expect(action).toBe('testAction')
    })
    store.dispatch('testAction')
    expect(i).toBe(2)
    store = createStore()
    const s = Symbol()
    define(s)
    store.use((payload, next, action) => {
      expect(arguments.length).toBe(3)
      expect(payload).toBeUndefined()
      expect(typeof next).toBe('function')
      expect(action === s).toBeTruthy()
    })
    store.dispatch(s)
  })

  it('need call next callback', () => {
    store.add('testAction', {
      partialState: {
        a: 0,
      },
      setter (state, payload) {
        expect(payload).toBe(3)
        return { a: ++payload }
      },
    })
    store.use((payload, next) => {
      expect(payload).toBe(1)
      next(++payload)
    })
    store.use('testAction', (payload, next) => {
      expect(payload).toBe(2)
      next(++payload)
    })
    store.dispatch('testAction', 1)
    expect(store.state.a).toBe(4)
  })

  it('[error] need call next callback', () => {
    let i = 0
    store.add('testAction', {
      partialState: {
        a: 0,
      },
      setter (state, payload) {
        i++
        return { a: ++payload }
      },
    })
    store.use((payload, next) => {
      i++
      expect(payload).toBe(1)
      next(++payload)
    })
    store.use('testAction', (payload, next) => {
      i++
      expect(payload).toBe(2)
    })
    store.dispatch('testAction', 1)
    expect(store.state.a).toBe(0)
    expect(i).toBe(2)
  })

  it('inspect middleware call order', done => {
    let i = 0
    let oneTime, twoTime, threeTime
    store.add('testActionOne', {
      partialState: {
        one: 0,
      },
      setter (state, payload) {
        const time = Date.now() - oneTime
        expect(payload).toBe(12)
        expect(isRangeTime(time, 100 * (payload - 10))).toBeTruthy()
        return { one: payload }
      },
    })
    store.add('testActionTwo', {
      partialState: {
        two: 0,
      },
      setter (state, payload) {
        const time = Date.now() - twoTime
        expect(payload).toBe(22)
        expect(isRangeTime(time, 200 * (payload - 20))).toBeTruthy()
        return { two: payload }
      },
    })
    store.add('testActionThree', {
      partialState: {
        three: 0,
      },
      setter (state, payload) {
        const time = Date.now() - threeTime
        expect(payload).toBe(32)
        expect(isRangeTime(time, 300 * (payload - 30))).toBeTruthy()
        expect(i).toBe(3)
        setTimeout(() => {
          expect(Object.keys(store.state).length).toBe(3)
          expect(store.state.one).toBe(12)
          expect(store.state.two).toBe(22)
          expect(store.state.three).toBe(32)
          done()
        })
        return { three: payload }
      },
    })
    store.use('testActionOne', (payload, next) => {
      expect(payload).toBe(10)
      setTimeout(() => next(++payload), 100)
    })
    store.use('testActionOne', (payload, next) => {
      expect(payload).toBe(11)
      setTimeout(() => next(++payload), 100)
    })
    store.use((payload, next) => {
      i++
      next(payload)
    })
    store.use('testActionTwo', (payload, next) => {
      expect(payload).toBe(20)
      setTimeout(() => next(++payload), 200)
    })
    store.use('testActionTwo', (payload, next) => {
      expect(payload).toBe(21)
      setTimeout(() => next(++payload), 200)
    })
    store.use('testActionThree', (payload, next) => {
      expect(payload).toBe(30)
      setTimeout(() => next(++payload), 300)
    })
    store.use('testActionThree', (payload, next) => {
      expect(payload).toBe(31)
      setTimeout(() => next(++payload), 300)
    })
    oneTime = Date.now()
    store.dispatch('testActionOne', 10)
    twoTime = Date.now()
    store.dispatch('testActionTwo', 20)
    threeTime = Date.now()
    store.dispatch('testActionThree', 30)
  })
})