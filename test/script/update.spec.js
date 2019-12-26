import { isError } from '../utils'
import createStore from '../../src/index'

describe('Update', () => {
  it('uninstalling components during update', done => {
    let i = 0
    const store = createStore()
    const ccm = cfg => {
      cfg.template = '<div>{{ global.name }}</div>'
      const id = simulate.load(Component(cfg))
      const cm = simulate.render(id)
      cm.instance._cfg = cfg
      cm.attach(document.createElement('parent-wrapper'))
      return cm
    }
    store.add('action', {
      partialState: {
        name: 'chen',
      },
      setter: (state, payload) => ({name: payload}),
    })
    const cmOne = ccm({
      storeConfig: {
        useState: () => ({
          name: state => state.name,
        }),
      },
    })
    const cmTwo = ccm({
      storeConfig: {
        useState: () => ({
          name: state => state.name,
        }),
      },
      attached() {
        i++
        expect(this._$loaded).toBeTrue()
        // unload component
        const setData = this.setData
        this.setData = (data, callback) => {
          i++
          setData.call(this, data, callback)
          this._cfg.detached.call(this)
          expect(this._$loaded).toBeFalse()
        }
      },
    })
    const cmThree = ccm({
      storeConfig: {
        useState: () => ({
          name: state => state.name,
        }),
      },
    })
    let called = false
    expect(store.depComponents.length).toBe(3)
    expect(cmOne.dom.textContent).toBe('chen')
    expect(cmTwo.dom.textContent).toBe('chen')
    expect(cmThree.dom.textContent).toBe('chen')
    store.dispatch('action', 'tao', payload => {
      expect(i).toBe(2)
      expect(payload).toBe('tao')
      expect(store.depComponents.length).toBe(2)
      expect(cmOne.dom.textContent).toBe('tao')
      expect(cmTwo.dom.textContent).toBe('tao')
      expect(cmThree.dom.textContent).toBe('tao')
      expect(called).toBeTrue()
      done()
    })
    setTimeout(() => {
      expect(store.depComponents.length).toBe(2)
      expect(cmOne.dom.textContent).toBe('tao')
      expect(cmTwo.dom.textContent).toBe('tao')
      expect(cmThree.dom.textContent).toBe('tao')
      called = true
    })
  })

  it('forceUpdata', done => {
    const store = createStore()
    store.add('action', {
      partialState: { name: 'tao' },
      setter (state, payload) {
        return { name: payload }
      }
    })
    const id = simulate.load(Component({
      template: '<div>{{ global.name }}</div>',
      storeConfig: {
        useState: () => ({ name: state => state.name }),
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(cm.dom.textContent).toBe('tao')
    expect(store.state.name).toBe('tao')
    store.dispatch('action', 'chen', () => {
      expect(store.state.name).toBe('chen')
      expect(cm.dom.textContent).toBe('chen')
      store.state = { name: 'imtaotao' }
      store.forceUpdate()
      expect(store.state.name).toBe('imtaotao')
      expect(cm.dom.textContent).toBe('imtaotao')
      done()
    })
    expect(store.state.name).toBe('chen')
  })

  it('restore', done => {
    const store = createStore()
    store.add('action', {
      partialState: { name: 'tao' },
      setter (state, payload) {
        return { name: payload }
      }
    })
    const id = simulate.load(Component({
      template: '<div>{{ global.name }}</div>',
      storeConfig: {
        useState: () => ({ name: state => state.name }),
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(cm.dom.textContent).toBe('tao')
    expect(store.state.name).toBe('tao')
    store.dispatch('action', 'chen', () => {
      expect(store.state.name).toBe('chen')
      expect(cm.dom.textContent).toBe('chen')
      store.dispatch('action', 'imtaotao', () => {
        expect(store.state.name).toBe('imtaotao')
        expect(cm.dom.textContent).toBe('imtaotao')
        expect(isError(() => store.restore())).toBeTrue()
        store.restore('action', () => {
          expect(store.state.name).toBe('tao')
          expect(cm.dom.textContent).toBe('tao')
          done()
        })
        expect(store.state.name).toBe('tao')
        expect(cm.dom.textContent).toBe('imtaotao')
      })
    })
  })

  it('restore namespace', done => {
    const store = createStore()
    store.add('action', {
      namespace: 'a.b',
      partialState: { name: 'tao' },
      setter (state, payload) {
        return { name: payload }
      }
    })
    const id = simulate.load(Component({
      template: '<div>{{ global.name }}</div>',
      storeConfig: {
        useState: () => ['a.b', { name: m => m.name }],
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect(cm.dom.textContent).toBe('tao')
    expect(store.state.a.b.name).toBe('tao')
    store.dispatch('action', 'chen', () => {
      expect(store.state.a.b.name).toBe('chen')
      expect(cm.dom.textContent).toBe('chen')
      store.dispatch('action', 'imtaotao', () => {
        expect(store.state.a.b.name).toBe('imtaotao')
        expect(cm.dom.textContent).toBe('imtaotao')
        expect(isError(() => store.restore())).toBeTrue()
        store.restore('action', () => {
          expect(store.state.a.b.name).toBe('tao')
          expect(cm.dom.textContent).toBe('tao')
          done()
        })
        expect(store.state.a.b.name).toBe('tao')
        expect(cm.dom.textContent).toBe('imtaotao')
      })
    })
  })

  it('restore error check', () => {
    const store = createStore()
    store.add('action', {
      setter (state, payload) {}
    })
    expect(isError(() => store.restore('action'))).toBeTrue()
  })
})