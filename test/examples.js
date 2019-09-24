// Data resource:
// https://github.com/benjamine/jsondiffpatch/blob/master/test/examples/diffpatch.js
export const a = [
  {
    left: undefined,
    right: true,
    delta: [true],
    reverse: [true, 0, 0],
  },

  {
    left: undefined,
    right: 42,
    delta: [42],
    reverse: [42, 0, 0],
  },
]

export const b = [
  {
    left: undefined,
    right: 'some text',
    delta: ['some text'],
    reverse: [new Date(), 0, 0],
  },

  {
    left: null,
    right: new Date(),
    delta: [new Date()],
    reverse: [new Date(), 0, 0],
  },
]

export const c = [
  {
    left: undefined,
    right: {
      a: 1,
      b: 2,
    },
    delta: [
      {
        a: 1,
        b: 2,
      },
    ],
    reverse: [
      {
        a: 1,
        b: 2,
      },
      0,
      0,
    ],
  },

  {
    left: undefined,
    right: [1, 2, 3],
    delta: [[1, 2, 3]],
    reverse: [[1, 2, 3], 0, 0],
  },
]

export const d = [
  {
    left: undefined,
    right: [1, 2, 3],
    delta: [[1, 2, 3]],
    reverse: [[1, 2, 3], 0, 0],
  },

  {
    left: undefined,
    right (x) {
      return x * x
    },
    error: /not supported/,
  },
]

export const e = [
  {
    left: null,
    right: 42,
    delta: [null, 42],
    reverse: [42, null],
  },

  {
    left: 42,
    right: [1, 2, 3],
    delta: [42, [1, 2, 3]],
    reverse: [[1, 2, 3], 42],
  },
]