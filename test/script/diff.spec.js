import {
  a,
  b,
  c,
  d,
  e,
  f,
} from '../examples'
import { expectPatch } from '../utils'
import diff, { ADD, REMOVE, REPLACE } from '../../src/diff'

const root = '/'

describe('Diff json', () => {
  it('a', () => {
    const patchs = diff(a[0], a[1], root)
    expect(patchs.length).toBe(3)
    expectPatch(patchs, `/['right']`, 42, REPLACE)
    expectPatch(patchs, `/['delta'][0]`, 42, REPLACE)
    expectPatch(patchs, `/['reverse'][0]`, 42, REPLACE)
  })

  it('b', () => {
    const patchs = diff(b[0], b[1], root)
    expect(patchs.length).toBe(4)
    expectPatch(patchs, `/['left']`, null, REPLACE)
    expectPatch(patchs, `/['right']`, b[1].right, REPLACE)
    expectPatch(patchs, `/['delta'][0]`, b[1].delta[0], REPLACE)
    expectPatch(patchs, `/['reverse'][0]`, b[1].reverse[0], REPLACE)
  })

  it('c', () => {
    const patchs = diff(c[0], c[1], root)
    expect(patchs.length).toBe(3)
    expectPatch(patchs, `/['right']`, c[1].right, REPLACE)
    expectPatch(patchs, `/['delta'][0]`, c[1].delta[0], REPLACE)
    expectPatch(patchs, `/['reverse'][0]`, c[1].reverse[0], REPLACE)
  })

  it('d', () => {
    const patchs = diff(d[0], d[1], root)
    expect(patchs.length).toBe(4)
    expectPatch(patchs, `/['delta']`, null, REMOVE)
    expectPatch(patchs, `/['reverse']`, null, REMOVE)
    expectPatch(patchs, `/['error']`, d[1].error, ADD)
    expectPatch(patchs, `/['right']`, d[1].right, REPLACE)
  })

  it('e', () => {
    const patchs = diff(e[0], e[1], root)
    expect(patchs.length).toBe(6)
    expectPatch(patchs, `/['left']`, 42, REPLACE)
    expectPatch(patchs, `/['right']`, e[1].right, REPLACE)
    expectPatch(patchs, `/['delta'][0]`, 42, REPLACE)
    expectPatch(patchs, `/['delta'][1]`, e[1].delta[1], REPLACE)
    expectPatch(patchs, `/['reverse'][0]`, e[1].reverse[0], REPLACE)
    expectPatch(patchs, `/['reverse'][1]`, e[1].reverse[1], REPLACE)
  })

  it('f', () => {
    const patchs = diff(f[0], f[1], root)
    expect(patchs.length).toBe(12)
    expectPatch(patchs, `/['delta']['_5']`, null, REMOVE)
    expectPatch(patchs, `/['name']`, f[1].name, REPLACE)
    expectPatch(patchs, `/['left']`, f[1].left, REPLACE)
    expectPatch(patchs, `/['exactReverse']`, false, ADD)
    expectPatch(patchs, `/['delta']['3']`, null, REMOVE)
    expectPatch(patchs, `/['reverse']['2']`, null, REMOVE)
    expectPatch(patchs, `/['right']`, f[1].right, REPLACE)
    expectPatch(patchs, `/['delta']['_2']`, f[1].delta._2, ADD)
    expectPatch(patchs, `/['delta']['2']`, f[1].delta[2], ADD)
    expectPatch(patchs, `/['reverse']['1']`, f[1].reverse[1], ADD)
    expectPatch(patchs, `/['reverse']['_2'][1]`, f[1].reverse._2[1], REPLACE)
    expectPatch(patchs, `/['options']['objectHash']`, f[1].options.objectHash, REPLACE)
  })
})