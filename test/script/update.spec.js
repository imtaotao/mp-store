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
      done()
    })
    expect(store.depComponents.length).toBe(2)
    expect(cmOne.dom.textContent).toBe('tao')
    expect(cmTwo.dom.textContent).toBe('tao')
    expect(cmThree.dom.textContent).toBe('tao')
  })
})