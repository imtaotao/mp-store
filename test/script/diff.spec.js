import {
  a,
  b,
  c,
  d,
} from '../examples'
import { expectPatch } from '../utils'
import diff, { ADD, REMOVE, REPLACE } from '../../src/diff'

const root = '/'

describe('Diff json', () => {
  it('a', () => {
    const patchs = diff(a[0], a[1], root)
    expect(patchs.length).toBe(3)
    expectPatch(patchs, '/.right', 42, REPLACE)
    expectPatch(patchs, '/.delta[0]', 42, REPLACE)
    expectPatch(patchs, '/.reverse[0]', 42, REPLACE)
  })

  it('b', () => {
    const patchs = diff(b[0], b[1], root)
    expect(patchs.length).toBe(4)
    expectPatch(patchs, '/.left', null, REPLACE)
    expectPatch(patchs, '/.right', b[1].right, REPLACE)
    expectPatch(patchs, '/.delta[0]', b[1].delta[0], REPLACE)
    expectPatch(patchs, '/.reverse[0]', b[1].reverse[0], REPLACE)
  })

  it('c', () => {
    const patchs = diff(c[0], c[1], root)
    expect(patchs.length).toBe(3)
    expectPatch(patchs, '/.right', c[1].right, REPLACE)
    expectPatch(patchs, '/.delta[0]', c[1].delta[0], REPLACE)
    expectPatch(patchs, '/.reverse[0]', c[1].reverse[0], REPLACE)
  })

  it('d', () => {
    const patchs = diff(d[0], d[1], root)
    expect(patchs.length).toBe(4)
    expectPatch(patchs, '/.delta', null, REMOVE)
    expectPatch(patchs, '/.reverse', null, REMOVE)
    expectPatch(patchs, '/.error', d[1].error, ADD)
    expectPatch(patchs, '/.right', d[1].right, REPLACE)
  })
})