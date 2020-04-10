import { isError } from '../utils'
import createStore from '../../src/index'

let store

beforeEach(() => {
  store = createStore(null, null, {
    env: 'product'
  })
})

describe('Options', () => {
  it('no inspect module attrs', () => {
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
    expect(isError(fn)).toBeFalse()
  })

  it('no check state attrs', () => {
    store.add('one', {
      partialState: { a: 1 },
    })
    const fn = () => store.add('two', {
      partialState: { a: 2 },
    })
    expect(isError(fn)).toBeFalse()
  })

  it('default store namespace', () => {
    store = createStore()
    const id = simulate.load(Component({
      template: '<div>{{ global.a }}</div>',
      storeConfig: {
        useState: () => ({ a: state => 1 }),
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect('store' in cm.instance).toBeTruthy()
    expect(cm.instance.store === store).toBeTrue()
    expect(cm.dom.textContent).toBe('1')
  })

  it('changed store namespace', () => {
    store = createStore(null, null, { storeNamespace: '$store' })
    const id = simulate.load(Component({
      template: '<div>{{ global.a }}</div>',
      storeConfig: {
        useState: () => ({ a: state => 1 }),
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect('store' in cm.instance).toBeFalsy()
    expect('$store' in cm.instance).toBeTruthy()
    expect(cm.instance.$store === store).toBeTrue()
    expect(cm.dom.textContent).toBe('1')
  })
})