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

export const f = [
  {
    name: 'nested change with item moved above',
    options: {
      objectHash(obj) {
        if (obj && obj.id) {
          return obj.id
        }
      },
    },
    left: [
      {
        id: 1,
      },
      {
        id: 2,
      },
      {
        id: 3,
        inner: {
          property: 'abc',
        },
      },
      {
        id: 4,
      },
      {
        id: 5,
      },
      {
        id: 6,
      },
    ],
    right: [
      {
        id: 1,
      },
      {
        id: 2,
      },
      {
        id: 6,
      },
      {
        id: 3,
        inner: {
          property: 'abcd',
        },
      },
      {
        id: 4,
      },
      {
        id: 5,
      },
    ],
    delta: {
      _t: 'a',
      3: {
        inner: {
          property: ['abc', 'abcd'],
        },
      },
      _5: ['', 2, 3],
    },
    reverse: {
      _t: 'a',
      2: {
        inner: {
          property: ['abcd', 'abc'],
        },
      },
      _2: ['', 5, 3],
    },
  },

  {
    name: 'nested change with item moved right above',
    options: {
      objectHash(obj) {
        if (obj && obj.id) {
          return obj.id
        }
      },
    },
    left: [
      {
        id: 1,
      },
      {
        id: 2,
        inner: {
          property: 'abc',
        },
      },
      {
        id: 3,
      },
    ],
    right: [
      {
        id: 1,
      },
      {
        id: 3,
      },
      {
        id: 2,
        inner: {
          property: 'abcd',
        },
      },
    ],
    delta: {
      _t: 'a',
      2: {
        inner: {
          property: ['abc', 'abcd'],
        },
      },
      _2: ['', 1, 3],
    },
    reverse: {
      _t: 'a',
      1: {
        inner: {
          property: ['abcd', 'abc'],
        },
      },
      _2: ['', 1, 3],
    },
    exactReverse: false,
  },
]