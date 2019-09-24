export const ADD = 1
export const REMOVE = 2
export const REPLACE = 3

function Patch (type, path, value) {
  this.type = type
  this.path = path
  this.value = value
}

// compare left and right values
function diffValues (left, right, path, patchs) {
  // filter functin and null
  if (typeof left === 'function' || left === null) {
    patchs.push(new Patch(REPLACE, path, right))
  } else if (Array.isArray(left)) {
    // diff array
    if (Array.isArray(right)) {
      walkArray(left, right, path, patchs)
    } else {
      patchs.push(new Patch(REPLACE, path, right))
    }
  } else if (typeof left === 'object') {
    // diff object
    if (right !== null && typeof right === 'object') {
      // filter Date object
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
  if (a.length <= b.length) {
    let len = a.length
    while (--len >= 0) {
      if (a[len] !== b[len]) {
        const path = `${base}[${len}]`
        diffValues(a[len], b[len], path, patchs)
      }
    }
  
    if (b.length > a.length) {
      len = b.length
      while (--len >= a.length) {
        const path = `${base}[${len}]`
        patchs.push(new Patch(ADD, path, b[len]))
      }
    }
  } else {
    // if new list less than old list,
    // no need diff, direct replac is fine.
    patchs.push(new Patch(REPLACE, base, b))
  }
}

function walkObject (a, b, base, patchs) {
  // walk left object
  for (const key in a) {
    // current path
    const path = `${base}.${key}`

    if (!(key in b)) {
      patchs.push(new Patch(REMOVE, path, null))
    } else if (a[key] !== b[key]) {
      diffValues(a[key], b[key], path, patchs)

      // don't use `delete` statement,
      // will destroy the stability of the `object` structure
      // delete b[key]
    }
  }

  // walk right object
  for (const key in b) {
    if (!(key in a)) {
      const path = `${base}.${key}`
      patchs.push(new Patch(ADD, path, b[key]))
    }
  }
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

// root `a` and root `b` is an object
export default function (a, b, basePath) {
  const patchs = []
  walkObject(a, b, basePath, patchs)
  return patchs
}