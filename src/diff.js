export const ADD = 1
export const REMOVE = 2
export const REPLACE = 3

function Patch (type, path, value) {
  this.type = type
  this.path = path
  this.value = value
}

// Compare left and right values
function diffValues (left, right, path, patchs) {
  // Filter functin and null
  if (typeof left === 'function' || left === null) {
    patchs.push(new Patch(REPLACE, path, right))
  } else if (Array.isArray(left)) {
    // Diff array
    if (Array.isArray(right)) {
      walkArray(left, right, path, patchs)
    } else {
      patchs.push(new Patch(REPLACE, path, right))
    }
  } else if (typeof left === 'object') {
    // Diff object
    if (right !== null && typeof right === 'object') {
      // Filter Date object
      if (left instanceof Date || right instanceof Date) {
        patchs.push(new Patch(REPLACE, path, right))
      } else {
        walkObject(left, right, path, patchs)
      }
    } else {
      patchs.push(new Patch(REPLACE, path, right))
    }
  } else {
    patchs.push(new Patch(REPLACE, path, right))
  }
}

function walkArray (a, b, base, patchs) {
  let len = a.length
  while (--len >= 0) {
    const path = `${base}[${len}]`

    // If a.length > b.length
    if (len > b.length - 1) {
      patchs.push(new Patch(REMOVE, path, null))
    } else if (a[len] !== b[len]) {
      diffValues(a[len], b[len], path, patchs)
    }
  }

  // If b.length > a.length
  if (b.length > a.length) {
    len = b.length
    while (--len >= a.length) {
      const path = `${base}[${len}]`
      patchs.push(new Patch(ADD, path, b[len]))
    }
  }

  // if (a.length === b.length) {
  //   let len = a.length
  //   while (--len >= 0) {
  //     const path = `${base}[${len}]`
  //     diffValues(a[len], b[len], path, patchs)
  //   }
  // } else {
  //   patchs.push(new Patch(REPLACE, base, b))
  // }
}

function walkObject (a, b, base, patchs) {
  // Walk left object
  for (const key in a) {
    // Current path
    const path = `${base}.${key}`

    if (!(key in b)) {
      patchs.push(new Patch(REMOVE, path, null))
    } else if (a[key] !== b[key]) {
      diffValues(a[key], b[key], path, patchs)

      // Don't use `delete` statement,
      // will destroy the stability of the `object` structure
      // delete b[key]
    }
  }

  // Walk right object
  for (const key in b) {
    if (!(key in a)) {
      const path = `${base}.${key}`
      patchs.push(new Patch(ADD, path, b[key]))
    }
  }
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

// Root `a` and root `b` is an object
export default function (a, b, basePath) {
  const patchs = []
  walkObject(a, b, basePath, patchs)
  return patchs
}