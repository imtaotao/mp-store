import { isError } from '../utils'
import { REPLACE } from '../../src/diff'
import createStore from '../../src/index'

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

  it('component add to deps', () => {
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
      },
    })
    expect(cfg.data.global.a).toBe(1)
    const id = simulate.load(cfg)
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(cm.data.global.a).toBe(1)
    expect(store.depComponents.length).toBe(1)
    expect(store.depComponents[0].component).toBe(cm.instance)
  })

  it('[error] component add to deps', () => {
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
  
  it('page add to deps', () => {
    const store = createStore()
    const instance = {}
    const cfg = Page({
      data: {},
      template: '<div></div>',
      storeConfig: {
        usedGlobalState () {
          return {
            a: state => 1,
          }
        },
      },
      onLoad (options) {
        expect(options).toBe(2)
        expect(this).toBe(instance)
      },
    })
    expect(cfg.data.global.a).toBe(1)
    instance.data = cfg.data
    cfg.onLoad.call(instance, 2)
    expect(store.depComponents.length).toBe(1)
    expect(store.depComponents[0].component).toBe(instance)
  })

  it('[error] page add to deps', () => {
    const store = createStore()
    const cfg = Page({
      data: {},
      storeConfig: {},
      template: '<div></div>',
    })
    expect('global' in cfg.data).toBeFalsy()
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

  it('inspect time of add dep and store for component', done => {
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
          expect(this.store).toBe(store)
          done()
        })
      },
    })
    const id = simulate.load(cfg)
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    cm.detach()
  })

  it('inspect time of add dep and store for page', done => {
    const store = createStore()
    const instance = {}
    const cfg = Page({
      template: '<div></div>',
      storeConfig: {
        usedGlobalState: () => ({ a: state => 1 }),
      },
      onLoad () {
        expect(store.depComponents.length).toBe(1)
        expect(store.depComponents[0].component).toBe(this)
        expect(this.store).toBe(store)
      },
      onUnload () {
        expect(store.depComponents.length).toBe(1)
        expect(store.depComponents[0].component).toBe(this)
        expect(this.store).toBe(store)
        setTimeout(() => {
          expect(store.depComponents.length).toBe(0)
          expect(this.store).toBe(store)
          done()
        })
      },
    })
    instance.data = cfg.data
    cfg.onLoad.call(instance)
    cfg.onUnload.call(instance)
  })

  it('inspect `willUpdate` behaiver', () => {
    const store = createStore()
    let i = 0
    store.add('testAction', {
      partialState: {
        name: 'tao',
      },
      setter: (state, payload) => ({ name: payload }),
    })
    const cfg = Component({
      template: '<div>{{ global.name }}</div>',
      storeConfig: {
        willUpdate (component, newPartialState) {
          i++
          expect(arguments.length).toBe(2)
          expect(this).toBe(store)
          expect(component).toBe(cm.instance)
          expect(component.data.global.name).toBe('tao')
          expect(store.state.name).toBe('taotao')
          expect(newPartialState.name).toBe('taotao')
        },
        usedGlobalState: () => ({ name: state => state.name }),
      },
    })
    expect(cfg.data.global.name).toBe('tao')
    const id = simulate.load(cfg)
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(cm.data.global.name).toBe('tao')
    expect(cm.dom.textContent).toBe('tao')
    store.dispatch('testAction', 'taotao')
    expect(cfg.data.global.name).toBe('tao')
    expect(cm.data.global.name).toBe('taotao')
    expect(cm.dom.textContent).toBe('taotao')
    expect(i).toBe(1)
  })

  it('inspect `willUpdate` behaiver, return false', () => {
    const store = createStore()
    store.add('testAction', {
      partialState: {
        name: 'tao',
      },
      setter: (state, payload) => ({ name: payload }),
    })
    const cfg = Component({
      template: '<div>{{ global.name }}</div>',
      storeConfig: {
        willUpdate: () => false,
        usedGlobalState: () => ({ name: state => state.name }),
      },
    })
    expect(cfg.data.global.name).toBe('tao')
    const id = simulate.load(cfg)
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(cm.data.global.name).toBe('tao')
    expect(cm.dom.textContent).toBe('tao')
    store.dispatch('testAction', 'taotao')
    expect(cfg.data.global.name).toBe('tao')
    expect(cm.data.global.name).toBe('tao')
    expect(cm.dom.textContent).toBe('tao')
  })

  it('inspect `didUpdate` behaiver', () => {
    const store = createStore()
    let i = 0
    store.add('testAction', {
      partialState: {
        name: 'tao',
      },
      setter: (state, payload) => ({ name: payload }),
    })
    const cfg = Component({
      template: '<div>{{ global.name }}</div>',
      storeConfig: {
        usedGlobalState: () => ({ name: state => state.name }),
        willUpdate() {
          expect(i++).toBe(0)
        },
        didUpdate (component, newPartialState, patchs) {
          expect(i++).toBe(1)
          expect(arguments.length).toBe(3)
          expect(this).toBe(store)
          expect(component).toBe(cm.instance)
          expect(component.data.global.name).toBe('taotao')
          expect(store.state.name).toBe('taotao')
          expect(newPartialState.name).toBe('taotao')
          expect(cm.dom.textContent).toBe('taotao')
          expect(patchs.length).toBe(1)
          expect(patchs[0].path).toBe('global.name')
          expect(patchs[0].type).toBe(REPLACE)
          expect(patchs[0].value).toBe('taotao')
          expect(patchs[0].leftValue).toBe('tao')
        },
      },
    })
    expect(cfg.data.global.name).toBe('tao')
    const id = simulate.load(cfg)
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(cm.data.global.name).toBe('tao')
    expect(cm.dom.textContent).toBe('tao')
    store.dispatch('testAction', 'taotao')
    expect(cfg.data.global.name).toBe('tao')
    expect(cm.data.global.name).toBe('taotao')
    expect(cm.dom.textContent).toBe('taotao')
    expect(i).toBe(2)
  })

  it('component init value is changed', () => {
    const store = createStore()
    let i = 0
    store.add('testAction', {
      partialState: {
        name: 'tao',
      },
      setter: (state, payload) => ({ name: payload }),
    })
    const cfgOne = Component({
      template: '<div>{{ global.name }}</div>',
      storeConfig: {
        usedGlobalState: () => ({ name: state => state.name }),
        willUpdate() {
          i++
        },
        didUpdate () {
          i++
        },
      },
    })
    const cfgTwo = Component({
      template: '<div>{{ global.name }}</div>',
      storeConfig: {
        usedGlobalState: () => ({ name: state => state.name }),
        willUpdate() {
          i++
        },
        didUpdate () {
          i++
        },
      },
    })
    expect(cfgOne.data.global.name).toBe('tao')
    expect(cfgTwo.data.global.name).toBe('tao')
    const oneId = simulate.load(cfgOne)
    const cmOne = simulate.render(oneId)
    const twoId = simulate.load(cfgTwo)
    const cmTwo = simulate.render(twoId)
    cmOne.attach(document.createElement('parent-wrapper'))
    cmOne.attach(document.createElement('parent-wrapper'))
    expect(cmOne.data.global.name).toBe('tao')
    expect(cmOne.dom.textContent).toBe('tao')
    store.dispatch('testAction', 'imtaotao')
    expect(cmOne.data.global.name).toBe('imtaotao')
    expect(cmOne.dom.textContent).toBe('imtaotao')
    expect(i).toBe(2)
    cmTwo.attach(document.createElement('parent-wrapper'))
    expect(cmTwo.data.global.name).toBe('imtaotao')
    expect(cmTwo.dom.textContent).toBe('imtaotao')
    expect(cfgTwo.data.global.name).toBe('tao')
    expect(i).toBe(2)
  })
})