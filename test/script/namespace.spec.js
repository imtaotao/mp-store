import { isError } from '../utils'
import createStore from '../../src/index'

describe('namespace', () => {
  it('inspect default namespace', () => {
    createStore()
    const id = simulate.load(Component({
      template: '<div>{{ global.a }}</div>',
      storeConfig: {
        usedGlobalState: () => ({ a: state => 1 }),
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect('global' in cm.data).toBeTruthy()
    expect(cm.dom.textContent).toBe('1')
  })

  it('inspect `setNamespace` method params', () => {
    const store = createStore()
    const fn = () => store.setNamespace()
    expect(isError(fn)).toBeTruthy()
    // must be a string
    store.setNamespace('globalTest')
    const id = simulate.load(Component({
      template: '<div>{{ globalTest.a }}</div>',
      storeConfig: {
        usedGlobalState: () => ({ a: state => 1 }),
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect('globalTest' in cm.data).toBeTruthy()
    expect(cm.dom.textContent).toBe('1')
  })

  it('inspect namespace in component and template', () => {
    const store = createStore()
    // must be a string
    store.setNamespace('globalTest')
    const id = simulate.load(Component({
      template: '<div>{{ globalTest.a }}</div>',
      storeConfig: {
        usedGlobalState: () => ({ a: state => 1 }),
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    expect('globalTest' in cm.data).toBeTruthy()
    expect(cm.dom.textContent).toBe('1')
  })
})