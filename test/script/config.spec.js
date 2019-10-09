import { isError } from '../utils'
import { createStore } from '../../src/index'

describe('component config', () => {
  it('delete `storeConfig` option', () => {
    window.Page = v => v
    window.Component = v => v
    createStore()
    const pageCfg = {
      storeConfig: {},
    }
    const componentCfg = {
      storeConfig: {},
    }
    Page(pageCfg)
    Component(componentCfg)
    expect('storeConfig' in pageCfg).toBeFalsy()
    expect('storeConfig' in componentCfg).toBeFalsy()
  })

  it('[error] delete `storeConfig` option', () => {
    window.Page = v => v
    window.Component = v => v
    const pageCfg = {
      storeConfig: {},
    }
    const componentCfg = {
      storeConfig: {},
    }
    Page(pageCfg)
    Component(componentCfg)
    expect('storeConfig' in pageCfg).toBeTruthy()
    expect('storeConfig' in componentCfg).toBeTruthy()
  })

  it('inspect `defineReducer` method', () => {
    const store = createStore()
    Component({
      storeConfig: {
        defineReducer (_store) {
          expect(this).toBe(_store)
          expect(_store).toBe(store)
          _store.add('testAction', {
            partialState: {
              a: 1,
            },
            setter (state, payload) {
              return { a: payload }
            },
          })
        },
      }
    })
    expect(store.reducers.length).toBe(1)
    expect(store.reducers[0].action).toBe('testAction')
    expect(Object.keys(store.state).length).toBe(1)
    expect(store.state.a).toBe(1)
    store.dispatch('testAction', 2)
    expect(Object.keys(store.state).length).toBe(1)
    expect(store.state.a).toBe(2)
  })

  it('`component add to deps`', () => {
    const store = createStore()
    const cfg = Component({
      data: {},
      template: '<div></div>',
      storeConfig: {
        usedGlobalState () {
          return {
            a: state => 1,
          }
        },
      }
    })
    expect(cfg.data.global.a).toBe(1)
    const id = simulate.load(cfg)
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(cm.data.global.a).toBe(1)
    expect(store.depComponents.length).toBe(1)
    expect(store.depComponents[0].component).toBe(cm.instance)
  })

  it('[error] `component add to deps`', () => {
    const store = createStore()
    const cfg = Component({
      data: {},
      storeConfig: {},
      template: '<div></div>',
    })
    expect('global' in cfg.data).toBeFalsy()
    const id = simulate.load(cfg)
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(store.depComponents.length).toBe(0)
  })

  it('inspect `usedGlobalState` method return object', () => {
    const store = createStore()
    const common = res => Component({
      template: '<div></div>',
      storeConfig: {
        usedGlobalState: () => res,
      },
    })
    const one = () => common(null)
    const two = () => common(Object.create({}))
    const three = () => common(Object.create(null))
    const four = () => common({ a: null })
    expect(isError(one)).toBeTruthy()
    expect(isError(two)).toBeTruthy()
    expect(isError(three)).toBeFalsy()
    expect(isError(four)).toBeTruthy()
    const cfg = common({
      a (state) {
        expect(state).toBe(store.state)
      },
    })
    expect(cfg.data.a).toBeUndefined()
  })

  it('inspect time of add dep and store', done => {
    const store = createStore()
    const cfg = Component({
      template: '<div></div>',
      storeConfig: {
        usedGlobalState: () => ({ a: state => 1 }),
      },
      attached () {
        expect(store.depComponents.length).toBe(1)
        expect(store.depComponents[0].component).toBe(this)
        expect(this.store).toBe(store)
      },
      detached () {
        expect(store.depComponents.length).toBe(1)
        expect(store.depComponents[0].component).toBe(this)
        expect(this.store).toBe(store)
        setTimeout(() => {
          expect(store.depComponents.length).toBe(0)
          expect(this.store).toBeNull()
          done()
        })
      },
    })
    const id = simulate.load(cfg)
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    cm.detach()
  })
})