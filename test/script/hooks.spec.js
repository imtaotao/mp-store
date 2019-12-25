import { isError } from '../utils'
import { REPLACE } from '../../src/diff'
import createStore from '../../src/index'
import { applyPatchs } from '../../src/update'

describe('Hooks', () => {
  it('createBefore', () => {
    let first = true
    const pageCfg = {}
    const componentCfg = {}
    const hooks = {
      createBefore (cfg, isPage) {
        expect(this).toBe(hooks)
        if (first) {
          expect(cfg).toBe(pageCfg)
          expect(isPage).toBeTruthy()
          cfg.a = 1
          first = false
        } else {
          expect(cfg).toBe(componentCfg)
          expect(isPage).toBeFalsy()
          cfg.a = 2
        }
      },
    }
    createStore(null, hooks)
    Page(pageCfg)
    Component(componentCfg)
    expect(pageCfg.a).toBe(1)
    expect(componentCfg.a).toBe(2)
  })

  it('addDep', done => {
    let i = 0
    const hooks = {
      addDep (component, isPage) {
        i++
        expect(arguments.length).toBe(2)
        expect(component).toBe(cm.instance)
        expect(isPage).toBeFalsy()
        expect(store.depComponents.length).toBe(0)
        setTimeout(() => {
          expect(store.depComponents.length).toBe(1)
          expect(store.depComponents[0].component).toBe(component)
        })
      },
    }
    const store = createStore(null, hooks)
    store.add('testAction', {
      partialState: { a: 1 },
      setter: (state, payload) => ({ a: payload })
    })
    const id = simulate.load(Component({
      template: '<div>{{ global.a }}</div>',
      storeConfig: {
        useState: () => ({ a: state => state.a }),
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(cm.dom.textContent).toBe('1')
    expect(store.depComponents.length).toBe(1)
    expect(store.depComponents[0].component).toBe(cm.instance)
    expect(i).toBe(1)
    store.dispatch('testAction', 2)
    setTimeout(() => {
      expect(cm.dom.textContent).toBe('2')
      done()
    })
  })

  it('addDep will return false', done => {
    let i = 0
    const hooks = {
      addDep () {
        i++
        setTimeout(() => {
          expect(store.depComponents.length).toBe(0)
          done()
        })
        return false
      },
    }
    const store = createStore(null, hooks)
    store.add('testAction', {
      partialState: { a: 1 },
      setter: (state, payload) => ({ a: payload })
    })
    const id = simulate.load(Component({
      template: '<div>{{ global.a }}</div>',
      storeConfig: {
        useState: () => ({ a: state => state.a }),
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(cm.dom.textContent).toBe('1')
    expect(i).toBe(1)
    expect(store.depComponents.length).toBe(0)
    store.dispatch('testAction', 2)
    expect(cm.dom.textContent).toBe('1')
  })

  it('willUpdate', done => {
    let i = 0
    const hooks = {
      willUpdate (component, newPartialState, patchs, isPage) {
        i++
        expect(arguments.length).toBe(4)
        expect(component).toBe(cm.instance)
        expect(newPartialState.a).toBe(2)
        expect(patchs.length).toBe(1)
        expect(patchs[0].type).toBe(REPLACE)
        expect(patchs[0].path).toBe('global.a')
        expect(patchs[0].value).toBe(2)
        expect(patchs[0].leftValue).toBe(1)
        expect(isPage).toBeFalsy()
      },
    }
    const store = createStore(null, hooks)
    store.add('testAction', {
      partialState: { a: 1 },
      setter: (state, payload) => ({ a: payload }),
    })
    const id = simulate.load(Component({
      template: '<div>{{ global.a }}</div>',
      storeConfig: {
        useState: () => ({ a: state => state.a }),
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(store.state.a).toBe(1)
    expect(cm.dom.textContent).toBe('1')
    store.dispatch('testAction', 2)
    expect(store.state.a).toBe(2)
    setTimeout(() => {
      expect(cm.dom.textContent).toBe('2')
      expect(i).toBe(1)
      done()
    })
  })

  it('willUpdate return false', done => {
    let i = 0
    const hooks = {
      willUpdate () {
        i++
        return false
      },
    }
    const store = createStore(null, hooks)
    store.add('testAction', {
      partialState: { a: 1 },
      setter: (state, payload) => ({ a: payload }),
    })
    const id = simulate.load(Component({
      template: '<div>{{ global.a }}</div>',
      storeConfig: {
        useState: () => ({ a: state => state.a }),
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(store.state.a).toBe(1)
    expect(cm.dom.textContent).toBe('1')
    store.dispatch('testAction', 2)
    expect(store.state.a).toBe(2)
    setTimeout(() => {
      expect(cm.dom.textContent).toBe('1')
      expect(i).toBe(1)
      done()
    })
  })

  it('didUpdate', done => {
    let i = 0
    const hooks = {
      willUpdate() {
        expect(i).toBe(0)
        i++
      },
      didUpdate (component, newPartialState, isPage) {
        expect(i).toBe(1)
        expect(arguments.length).toBe(3)
        expect(component).toBe(cm.instance)
        expect(newPartialState.a).toBe(2)
        expect(isPage).toBeFalsy()
        expect(store.state.a).toBe(2)
        expect(cm.dom.textContent).toBe('2')
        i++
      },
    }
    const store = createStore(null, hooks)
    store.add('testAction', {
      partialState: { a: 1 },
      setter: (state, payload) => ({ a: payload }),
    })
    const id = simulate.load(Component({
      template: '<div>{{ global.a }}</div>',
      storeConfig: {
        useState: () => ({ a: state => state.a }),
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(store.state.a).toBe(1)
    expect(cm.dom.textContent).toBe('1')
    store.dispatch('testAction', 2)
    expect(store.state.a).toBe(2)
    setTimeout(() => {
      expect(cm.dom.textContent).toBe('2')
      expect(i).toBe(2)
      done()
    })
  })

  it('middlewareError', () => {
    let i = 0
    const hooks = {
      middlewareError (action, payload, error) {
        i++
        expect(arguments.length).toBe(3)
        expect(action).toBe('testAction')
        expect(payload).toBe(2)
        expect(error).toBe('middlewareError')
      },
    }
    const store = createStore(null, hooks)
    store.add('testAction', {
      partialState: { a: 1 },
      setter: (state, payload) => ({ a: payload }),
    })
    store.use('testAction', () => {
      throw 'middlewareError'
    })
    store.dispatch('testAction', 2)
    expect(i).toBe(1)
  })

  it('[error] middlewareError', () => {
    const store = createStore()
    store.add('testAction', {
      partialState: { a: 1 },
      setter: (state, payload) => ({ a: payload }),
    })
    store.use('testAction', () => {
      throw 'middlewareError'
    })
    const fn = () => store.dispatch('testAction', 2)
    expect(isError(fn)).toBeTruthy()
  })

  it('`applyPatchs`', done => {
    let i = 0
    const hooks = {
      willUpdate (component, newPartialState, patchs, isPage) {
        i++
        applyPatchs(component, patchs)
        return false
      },
    }
    const store = createStore(null, hooks)
    store.add('testAction', {
      partialState: { a: 1 },
      setter: (state, payload) => ({ a: payload }),
    })
    const id = simulate.load(Component({
      template: '<div>{{ global.a }}</div>',
      storeConfig: {
        useState: () => ({ a: state => state.a }),
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(store.state.a).toBe(1)
    expect(cm.dom.textContent).toBe('1')
    store.dispatch('testAction', 2)
    expect(store.state.a).toBe(2)
    setTimeout(() => {
      expect(cm.dom.textContent).toBe('2')
      expect(i).toBe(1)
      done()
    })
  })
})