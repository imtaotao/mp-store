import {
  a,
  b,
  c,
  d,
  e,
  f,
  g,
  h,
} from '../examples'
import {
  diff,
  restore,
  ADD,
  REMOVE,
  REPLACE,
} from '../../src/diff'
import { clone } from '../../src/utils'
import { isError, expectPatch } from '../utils'

const root = '/'

describe('Json diff', () => {
  it('a', () => {
    const patchs = diff(a[0], a[1], root)
    expect(patchs.length).toBe(3)
    expectPatch(patchs, `/.right`, 42, REPLACE)
    expectPatch(patchs, `/.delta[0]`, 42, REPLACE)
    expectPatch(patchs, `/.reverse[0]`, 42, REPLACE)
  })

  it('b', () => {
    const patchs = diff(b[0], b[1], root)
    expect(patchs.length).toBe(4)
    expectPatch(patchs, `/.left`, null, REPLACE)
    expectPatch(patchs, `/.right`, b[1].right, REPLACE)
    expectPatch(patchs, `/.delta[0]`, b[1].delta[0], REPLACE)
    expectPatch(patchs, `/.reverse[0]`, b[1].reverse[0], REPLACE)
  })

  it('c', () => {
    const patchs = diff(c[0], c[1], root)
    expect(patchs.length).toBe(3)
    expectPatch(patchs, `/.right`, c[1].right, REPLACE)
    expectPatch(patchs, `/.delta[0]`, c[1].delta[0], REPLACE)
    expectPatch(patchs, `/.reverse[0]`, c[1].reverse[0], REPLACE)
  })

  it('d', () => {
    const patchs = diff(d[0], d[1], root)
    expect(patchs.length).toBe(4)
    expectPatch(patchs, `/.delta`, null, REMOVE)
    expectPatch(patchs, `/.reverse`, null, REMOVE)
    expectPatch(patchs, `/.error`, d[1].error, ADD)
    expectPatch(patchs, `/.right`, d[1].right, REPLACE)
  })

  it('e', () => {
    const patchs = diff(e[0], e[1], root)
    expect(patchs.length).toBe(6)
    expectPatch(patchs, `/.left`, 42, REPLACE)
    expectPatch(patchs, `/.right`, e[1].right, REPLACE)
    expectPatch(patchs, `/.delta[0]`, 42, REPLACE)
    expectPatch(patchs, `/.delta[1]`, e[1].delta[1], REPLACE)
    expectPatch(patchs, `/.reverse[0]`, e[1].reverse[0], REPLACE)
    expectPatch(patchs, `/.reverse[1]`, e[1].reverse[1], REPLACE)
  })

  it('f', () => {
    const patchs = diff(f[0], f[1], root)
    expect(patchs.length).toBe(12)
    expectPatch(patchs, `/.name`, f[1].name, REPLACE)
    expectPatch(patchs, `/.left`, f[1].left, REPLACE)
    expectPatch(patchs, `/.exactReverse`, false, ADD)
    expectPatch(patchs, `/.delta.3`, null, REMOVE)
    expectPatch(patchs, `/.delta._5`, null, REMOVE)
    expectPatch(patchs, `/.reverse.2`, null, REMOVE)
    expectPatch(patchs, `/.right`, f[1].right, REPLACE)
    expectPatch(patchs, `/.delta._2`, f[1].delta._2, ADD)
    expectPatch(patchs, `/.delta.2`, f[1].delta[2], ADD)
    expectPatch(patchs, `/.reverse.1`, f[1].reverse[1], ADD)
    expectPatch(patchs, `/.reverse._2[1]`, f[1].reverse._2[1], REPLACE)
    expectPatch(patchs, `/.options.objectHash`, f[1].options.objectHash, REPLACE)
  })

  it('g', () => {
    const patchs = diff(g[0], g[1], root)
    expect(patchs.length).toBe(26)
    expectPatch(patchs, `/.name`, g[1].name, REPLACE)
    expectPatch(patchs, `/.right[1]`, 2, REPLACE)
    expectPatch(patchs, `/.right[2]`, 3, REPLACE)
    expectPatch(patchs, `/.right[3]`, 4, REPLACE)
    expectPatch(patchs, `/.right[4]`, 5, REPLACE)
    expectPatch(patchs, `/.right[5]`, 5.1, REPLACE)
    expectPatch(patchs, `/.right[6]`, 5.2, REPLACE)
    expectPatch(patchs, `/.right[7]`, 5.3, REPLACE)
    expectPatch(patchs, `/.right[8]`, 6, ADD)
    expectPatch(patchs, `/.right[9]`, 7, ADD)
    expectPatch(patchs, `/.right[10]`, 8, ADD)
    expectPatch(patchs, `/.right[11]`, 9, ADD)
    expectPatch(patchs, `/.right[12]`, 10, ADD)
    expectPatch(patchs, `/.delta._1`, null, REMOVE)
    expectPatch(patchs, `/.delta._5`, null, REMOVE)
    expectPatch(patchs, `/.delta._6`, null, REMOVE)
    expectPatch(patchs, `/.delta.5`, g[1].delta[5], ADD)
    expectPatch(patchs, `/.delta.6[0]`, g[1].delta[6][0], REPLACE)
    expectPatch(patchs, `/.delta.7`, g[1].delta[7], ADD)
    expectPatch(patchs, `/.reverse._5`, g[1].reverse['_5'], ADD)
    expectPatch(patchs, `/.reverse._6[0]`, g[1].reverse['_6'][0], REPLACE)
    expectPatch(patchs, `/.reverse._7`, g[1].reverse['_7'], ADD)
    expectPatch(patchs, `/.reverse._8`, g[1].reverse['_8'], REPLACE)
    expectPatch(patchs, `/.reverse.1`, null, REMOVE)
    expectPatch(patchs, `/.reverse.5`, null, REMOVE)
    expectPatch(patchs, `/.reverse.6`, null, REMOVE)
  })

  it('h', () => {
    const patchs = diff(h[0], h[1], root)
    expect(patchs.length).toBe(6)
    expectPatch(patchs, `/.right`, h[1].right, REPLACE)
    expectPatch(patchs, `/.delta._a`, null, REMOVE)
    expectPatch(patchs, `/.delta._b`, h[1].delta._b, ADD)
    expectPatch(patchs, `/.reverse._2`, h[1].reverse._2, REPLACE)
    expectPatch(patchs, `/.reverse._3[0]`, h[1].reverse._3[0], REPLACE)
    expectPatch(patchs, `/.reverse._3[1]`, h[1].reverse._3[1], ADD)
  })

  it('a restore', () => {
    const patchs = diff(a[0], a[1], root)
    const nv = restore(clone(a[1]), patchs)
    expect(a[0]).toEqual(nv)
    expect(diff(a[0], nv).length).toBe(0)
  })

  it('b restore', () => {
    const patchs = diff(b[0], b[1], root)
    const nv = restore(clone(b[1]), patchs)
    expect(b[0]).toEqual(nv)
    expect(diff(b[0], nv).length).toBe(0)
  })
  
  it('c restore', () => {
    const patchs = diff(c[0], c[1], root)
    const nv = restore(clone(c[1]), patchs)
    expect(c[0]).toEqual(nv)
    expect(diff(c[0], nv).length).toBe(0)
  })

  it('d restore', () => {
    const patchs = diff(d[0], d[1], root)
    const nv = restore(clone(d[1]), patchs)
    expect(d[0]).toEqual(nv)
    expect(diff(d[0], nv).length).toBe(0)
  })

  it('e restore', () => {
    const patchs = diff(e[0], e[1], root)
    const nv = restore(clone(e[1]), patchs)
    expect(e[0]).toEqual(nv)
    expect(diff(e[0], nv).length).toBe(0)
  })
  
  it('f restore', () => {
    const patchs = diff(f[0], f[1], root)
    const nv = restore(clone(f[1]), patchs)
    expect(f[0]).toEqual(nv)
    expect(diff(f[0], nv).length).toBe(0)
  })

  it('g restore', () => {
    const patchs = diff(g[0], g[1], root)
    const nv = restore(clone(g[1]), patchs)
    expect(g[0]).toEqual(nv)
    expect(diff(g[0], nv).length).toBe(0)
  })

  it('h restore', () => {
    const patchs = diff(h[0], h[1], root)
    const nv = restore(clone(h[1]), patchs)
    expect(h[0]).toEqual(nv)
    expect(diff(h[0], nv).length).toBe(0)
  })

  it('restore method', () => {
    const one = { a: 1 }
    const two = { a: 2 }
    const patchs = diff(one, two)
    expect(restore(clone(two), patchs)).toEqual(one)
    patchs[0].path = ''
    expect(restore(clone(two), patchs)).toEqual(two)
  })

  it('deepClone', () => {
    const one = { a: 1 }
    one.b = one
    const two = Object.create(null)
    two.a = 1
    two.b = two
    expect(isError(() => JSON.stringify(one))).toBeTruthy()
    expect(isError(() => JSON.stringify(two))).toBeTruthy()
    const copyOne = clone(one)
    const copyTwo = clone(two)
    expect(copyOne === one).toBeFalsy()
    expect(copyTwo === two).toBeFalsy()
    expect(copyOne.a).toBe(1)
    expect(copyTwo.a).toBe(1)
    expect(copyOne.b).toBe(copyOne)
    expect(copyTwo.b).toBe(copyTwo)
  })
})