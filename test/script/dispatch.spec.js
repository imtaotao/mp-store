import { isError } from '../utils'
import createStore from '../../src/index'

let store

beforeEach(() => {
  store = createStore()
})

describe('Dispatch', () => {
  it('store state cannot be changed', () => {
    const one = () => store.state.a = 2
    expect(isError(one)).toBeTruthy()
    store.add('testAction', {
      partialState: {
        a: 1,
        arr: [{
          n: '',
        }],
      },
    })
    expect(Object.keys(store.state).length).toBe(2)
    expect(store.state.a).toBe(1)
    expect(store.state.arr.length).toBe(1)
    const two = () => store.state.a = 2
    const three = () => store.state.arr.push(1)
    const four = () => store.state.arr[0].n = 1
    expect(isError(two)).toBeTruthy()
    expect(isError(three)).toBeTruthy()
    expect(isError(four)).toBeTruthy()
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

  it('allow call dispatch in update callback', done => {
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
      expect(i).toBe(3)
      done()
    })
  })

  it('allow add new middleware in update callback', done => {
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
      store.dispatch('testAction')
      expect(store.middleware.stack.length).toBe(2)
      expect(i).toBe(2)
      done()
    })
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
      callback (destPayload) {
        expect(Object.keys(store.state).length).toBe(1)
        expect(store.state.a).toBe(1)
        expect(destPayload).toBe('null')
      }
    }
    spyOn(obj, 'callback')
    store.add('testAction', {
      partialState: {},
      setter (state, payload) {
        expect(payload).toBe('null')
        setTimeout(() => {
          setTimeout(() => {
            expect(obj.callback).toHaveBeenCalled()
            expect(obj.callback).toHaveBeenCalledWith('null')
            done()
          })
        })
        return { a: 1 }
      },
    })
    store.use('testAction', (payload, next) => {
      expect(payload).toBeNull()
      setTimeout(() => next(String(payload)))
    })
    store.dispatch('testAction', null, obj.callback)
    expect(Object.keys(store.state).length).toBe(0)
    expect(store.state.a).toBeUndefined()
  })

  it('dispatch `callback` after the component and view is updated', done => {
    const store = createStore()
    store.add('testAction', {
      partialState: {
        a: 1,
        b: 2,
      },
      setter: (state, payload) => ({ a: payload }) 
    })
    const oneId = simulate.load(Component({
      template: '<div>{{ global.a }}</div>',
      storeConfig: {
        useState: () => ({
          a: state => state.a,
        }),
      },
    }))
    const twoId = simulate.load(Component({
      template: '<div>{{ global.b }}</div>',
      storeConfig: {
        useState: () => ({
          b: state => state.b,
        }),
      },
    }))
    const threeId = simulate.load(Component({
      template: '<div>{{ global.b }}</div>',
      storeConfig: {
        useState: () => ({
          a: state => state.a,
        }),
      },
    }))
    const cmOne = simulate.render(oneId)
    cmOne.attach(document.createElement('parent-wrapper'))
    const cmTwo = simulate.render(twoId)
    cmTwo.attach(document.createElement('parent-wrapper'))
    const cmThree = simulate.render(threeId)
    cmThree.attach(document.createElement('parent-wrapper'))
    // if delete component global data
    cmThree.data[store.GLOBALWORD] = null
    expect(cmOne.dom.textContent).toBe('1')
    expect(cmOne.data.global.a).toBe(1)
    expect(store.state.a).toBe(1)
    store.dispatch('testAction', 2, () => {
      expect(cmOne.dom.textContent).toBe('2')
      expect(cmOne.data.global.a).toBe(2)
      expect(store.state.a).toBe(2)
      done()
    })
  })

  it('component data update', done => {
    // need to recreate store
    const store = createStore()
    let i = 0
    let j = 0
    store.add('testAction', {
      partialState: {
        name: 'tao',
      },
      setter (state, payload) {
        return { name: payload }
      },
    })
    store.use((payload, next) => next(payload + '_'))
    expect(i).toBe(0)
    expect(j).toBe(0)
    const cmOneId = simulate.load(Component({
      template: '<div>{{ global.name }}</div>',
      storeConfig: {
        useState (_store) {
          expect(store === _store).toBeTruthy()
          expect(this === _store).toBeTruthy()
          return {
            name (state) {
              i++
              return state.name
            },
          }
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
        useState (_store) {
          expect(store === _store).toBeTruthy()
          expect(this === _store).toBeTruthy()
          return {
            name (state) {
              j++
              return state.name
            },
          }
        },
      },
      methods: {
        changed () {
          store.dispatch('testAction', 'imtaotao')
        },
      },
    }))
    expect(i).toBe(1)
    expect(j).toBe(1)
    const parent = document.createElement('parent-wrapper')
    const cmOne = simulate.render(cmOneId)
    const cmTwo = simulate.render(cmTwoId)
    cmOne.attach(parent)
    cmTwo.attach(parent)
    const fn = text => {
      expect(cmOne.instance.data.global.name).toBe(text)
      expect(cmTwo.instance.data.global.name).toBe(text)
      expect(cmOne.dom.innerHTML).toBe(`<div>${text}</div>`)
      expect(cmTwo.dom.innerHTML).toBe(`<div>${text}</div>`)
    }
    fn('tao')
    // called once when attach.
    expect(i).toBe(2)
    expect(j).toBe(2)
    cmOne.instance.changed()
    setTimeout(() => {
      fn('taotao_')
      expect(i).toBe(3)
      expect(j).toBe(3)
      cmTwo.instance.changed()
      setTimeout(() => {
        fn('imtaotao_')
        expect(i).toBe(4)
        expect(j).toBe(4)
        done()
      }, 100)
    })
  })

  it('mutiple component and parent-child component update', done => {
    const store = createStore()
    store.add('testAction', {
      partialState: {
        a: 1,
        b: 2,
      },
      setter: (state, payload) => payload,
    })
    const createComponent = (cfg = {}) => {
      const id = simulate.load(Component(
        Object.assign(
          {
            storeConfig: {
              useState: () => ({
                a: state => state.a,
                b: state => state.b,
              }),
            },
            methods: {
              changed (payload) {
                this.store.dispatch('testAction', payload)
              },
            }
          },
          cfg,
        )
      ))
      const cm = simulate.render(id)
      cm.attach(document.createElement('parent-wrapper'))
      return [cm, id]
    }
    const [cmOne, oneId] = createComponent({
      template: '<div>{{ global.a }}+{{ global.b }}</div>',
    })
    const [cmTwo, twoId] = createComponent({
      usingComponents: { cmOne: oneId },
      template: '<div><cmOne />-{{ global.a }}+{{ global.b }}</div>',
    })
    const [cmThree, threeId] = createComponent({
      usingComponents: { cmTwo: twoId },
      template: '<div><cmTwo />-{{ global.a }}+{{ global.b }}</div>',
    })
    const inspect = (a, b) => {
      const state = { a, b }
      const atext = `${a}+${b}`
      const btext = `${atext}-${a}+${b}`
      const ctext = `${btext}-${a}+${b}`
      expect(store.state).toEqual(state)
      expect(cmOne.dom.textContent).toBe(atext)
      expect(cmOne.data.global).toEqual(state)
      expect(cmTwo.dom.textContent).toBe(btext)
      expect(cmTwo.data.global).toEqual(state)
      expect(cmThree.dom.textContent).toBe(ctext)
      expect(cmThree.data.global).toEqual(state)
    }
    inspect(1, 2)
    cmOne.instance.changed({ a: 2 })
    setTimeout(() => {
      inspect(2, 2)
      cmTwo.instance.changed({ a: 1, b: 1})
      setTimeout(() => {
        inspect(1, 1)
        cmTwo.instance.changed({ b: 3 })
        setTimeout(() => {
          inspect(1, 3)
          done()
        })
      })
    })
  })

  it('[async] mutiple component and parent-child component update', done => {
    const store = createStore()
    store.add('testAction', {
      partialState: {
        a: 1,
        b: 2,
      },
      setter: (state, payload) => payload,
    })
    store.use((payload, next) => {
      setTimeout(() => next(payload))
    })
    const createComponent = (cfg = {}) => {
      const id = simulate.load(Component(
        Object.assign(
          {
            storeConfig: {
              useState: () => ({
                a: state => state.a,
                b: state => state.b,
              }),
            },
            methods: {
              changed (payload, cb) {
                this.store.dispatch('testAction', payload, cb)
              },
            }
          },
          cfg,
        )
      ))
      const cm = simulate.render(id)
      cm.attach(document.createElement('parent-wrapper'))
      return [cm, id]
    }
    const [cmOne, oneId] = createComponent({
      template: '<div>{{ global.a }}+{{ global.b }}</div>',
    })
    const [cmTwo, twoId] = createComponent({
      usingComponents: { cmOne: oneId },
      template: '<div><cmOne />-{{ global.a }}+{{ global.b }}</div>',
    })
    const [cmThree, threeId] = createComponent({
      usingComponents: { cmTwo: twoId },
      template: '<div><cmTwo />-{{ global.a }}+{{ global.b }}</div>',
    })
    const inspect = (a, b) => {
      const state = { a, b }
      const atext = `${a}+${b}`
      const btext = `${atext}-${a}+${b}`
      const ctext = `${btext}-${a}+${b}`
      expect(store.state).toEqual(state)
      expect(cmOne.dom.textContent).toBe(atext)
      expect(cmOne.data.global).toEqual(state)
      expect(cmTwo.dom.textContent).toBe(btext)
      expect(cmTwo.data.global).toEqual(state)
      expect(cmThree.dom.textContent).toBe(ctext)
      expect(cmThree.data.global).toEqual(state)
    }
    inspect(1, 2)
    cmOne.instance.changed({ a: 2 }, () => {
      inspect(2, 2)
      cmTwo.instance.changed({ a: 1, b: 1 }, () => {
        inspect(1, 1)
        cmTwo.instance.changed({ b: 3 }, () => {
          inspect(1, 3)
          done()
        })
      })
    })
  })

  it('dispatch a function', done => {
    const store = createStore()
    store.add('testAction', {
      partialState: {
        fn: () => 1,
      },
      setter: (state, payload) => ({ fn: payload }) 
    })
    const id = simulate.load(Component({
      template: '<div bindtap="global.fn"></div>',
      storeConfig: {
        useState: () => ({
          fn: state => state.fn,
        }),
      },
    }))
    const newfn = () => 2
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(store.state.fn()).toBe(1)
    expect(cm.data.global.fn()).toBe(1)
    store.dispatch('testAction', newfn, () => {
      expect(store.state.fn).toBe(newfn)
      expect(store.state.fn()).toBe(2)
      expect(cm.data.global.fn).toBe(newfn)
      expect(cm.data.global.fn()).toBe(2)
      done()
    })
  })
})