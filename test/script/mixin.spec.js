import { isError } from '../utils'
import createStore from '../../src/index'

describe('mixin', () => {
  it('inspect params', () => {
    createStore(define => {
      const one = () => define()
      const two = () => define('a')
      const three = () => define(null, () => {})
      const four = () => define('b', null)
      const five = () => define('c', () => {})
      const six = () => define('d', function () {})
      expect(isError(one)).toBeTruthy()
      expect(isError(two)).toBeTruthy()
      expect(isError(three)).toBeTruthy()
      expect(isError(four)).toBeTruthy()
      expect(isError(five)).toBeFalsy()
      expect(isError(six)).toBeFalsy()
    })
  })

  it('can\'t repeat mixin method', () => {
    createStore(define => {
      const one = () => define('a', () => {})
      const two = () => define('a', () => {})
      const three = () => define('a', function () {})
      expect(isError(one)).toBeFalsy()
      expect(isError(two)).toBeTruthy()
      expect(isError(three)).toBeTruthy()
    })
  })

  it('component is success mixin', () => {
    let i = 0
    createStore(define => {
      define('a', t => {
        i++
        expect(t).toBe(1)
      })
      define('b', t => {
        i++
        expect(t).toBe(2)
      })
      define('c', t => {
        i++
        expect(t).toBe(3)
      })
    })
    const config = {
      template: '<div>tao<div>',
    }
    const id = simulate.load(Component(config))
    expect(!!config.methods).toBeTruthy()
    expect(Object.keys(config.methods).length).toBe(3)
    const cm = simulate.render(id).instance
    expect(typeof cm.a).toBe('function')
    expect(typeof cm.b).toBe('function')
    expect(typeof cm.c).toBe('function')
    cm.a(1)
    cm.b(2)
    cm.c(3)
    expect(i).toBe(3)
  })

  it('page is success mixin', () => {
    let i = 0
    createStore(define => {
      define('a', t => {
        i++
        expect(t).toBe(1)
      })
      define('b', t => {
        i++
        expect(t).toBe(2)
      })
      define('c', t => {
        i++
        expect(t).toBe(3)
      })
    })
    const config = {}
    Page(config)
    expect(typeof config.a).toBe('function')
    expect(typeof config.b).toBe('function')
    expect(typeof config.c).toBe('function')
    config.a(1)
    config.b(2)
    config.c(3)
    expect(i).toBe(3)
  })
})