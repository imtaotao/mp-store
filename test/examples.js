// Data resource:
// https://github.com/benjamine/jsondiffpatch/blob/master/test/examples/diffpatch.js
const exampleDate = new Date()

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

export const g = [
  {
    name: 'simple values',
    left: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    right: [1, 3, 4, 5, 8, 9, 9.1, 10],
    delta: {
      _t: 'a',
      _1: [2, 0, 0],
      _5: [6, 0, 0],
      _6: [7, 0, 0],
      6: [9.1],
    },
    reverse: {
      _t: 'a',
      1: [2],
      5: [6],
      6: [7],
      _6: [9.1, 0, 0],
      _8: [1, 2],
    },
  },

  {
    name: 'added block',
    left: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    right: [1, 2, 3, 4, 5, 5.1, 5.2, 5.3, 6, 7, 8, 9, 10],
    delta: {
      _t: 'a',
      5: [5.1],
      6: [5.2],
      7: [5.3],
    },
    reverse: {
      _t: 'a',
      _5: [5.1, 0, 0],
      _6: [5.2, 0, 0],
      _7: [5.3, 0, 0],
      _8: [1],
    },
  },
]

export const h = [
  {
    left: exampleDate,
    right: new Date(),
    delta: {
      _a: new Date(),
    },
    reverse: {
      _1: [exampleDate, 1],
      _2: [new Date(), 1, 2],
      _3: [exampleDate],
    },
  },

  {
    left: exampleDate,
    right: new Date(),
    delta: {
      _b: new Date(),
    },
    reverse: {
      _1: [exampleDate, 1],
      _2: [exampleDate, 2],
      _3: [1, exampleDate],
    },
  },
]