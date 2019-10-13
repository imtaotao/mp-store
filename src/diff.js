export const ADD = 1
export const REMOVE = 2
export const REPLACE = 3

function Patch (type, path, value, leftValue) {
  this.type = type
  this.path = path
  this.value = value
  this.leftValue = leftValue
}

// compare left and right values
function diffValues (left, right, path, patchs) {
  // filter functin and null
  if (typeof left === 'function' || left === null) {
    patchs.push(new Patch(REPLACE, path, right, left))
  } else if (Array.isArray(left)) {
    // diff array
    if (Array.isArray(right)) {
      walkArray(left, right, path, patchs)
    } else {
      patchs.push(new Patch(REPLACE, path, right, left))
    }
  } else if (typeof left === 'object') {
    // diff object
    if (
        right !== null &&
        typeof right === 'object' &&
        !Array.isArray(right)
    ) {
      // filter Date object
      if (left instanceof Date || right instanceof Date) {
        patchs.push(new Patch(REPLACE, path, right, left))
      } else {
        walkObject(left, right, path, patchs)
      }
    } else {
      patchs.push(new Patch(REPLACE, path, right, left))
    }
  } else {
    patchs.push(new Patch(REPLACE, path, right, left))
  }
}

// if array is `[1, 2, 3, a: dd]`, filter `a`
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
        patchs.push(new Patch(ADD, path, b[len], a[len]))
      }
    }
  } else {
    // if new list less than old list,
    // no need diff, direct replac is fine.
    patchs.push(new Patch(REPLACE, base, b, a))
  }
}

function walkObject (a, b, base, patchs) {
  // walk left object
  for (const key in a) {
    // current path
    const path = `${base}.${key}`

    if (!(key in b)) {
      patchs.push(new Patch(REMOVE, path, null, a[key]))
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
      patchs.push(new Patch(ADD, path, b[key], null))
    }
  }
}

// root `a` and root `b` is an object
export function diff (a, b, basePath) {
  const patchs = []
  walkObject(a, b, basePath, patchs)
  return patchs
}

// return target object
function separatePath (obj, path) {
  const REG = /(?<=[\[\].])[^\[\].]+/g
  const keys = path.match(REG)

  if (keys) {
    let i = -1
    let key = null
    let target = obj
    let prevTarget = null

    while (i++ < keys.length - 2) {
      prevTarget = target
      key = keys[i]
      target = target[key]
    }

    return [target, key, prevTarget, keys[keys.length -1]]
  }
}

export function restore (obj, patchs) {
  let len = patchs.length
  const delEmptys = new Map()

  while (--len >= 0) {
    const { type, path, leftValue } = patchs[len]
    const parseItem = separatePath(obj, path)

    if (parseItem) {
      const [target, key, prevTarget, lastKey] = parseItem

      // reverse recovery
      switch (type) {
        case REMOVE :
          target[lastKey] = leftValue
          break
        case REPLACE :
          target[lastKey] = leftValue
          break
        case ADD :
          if (Array.isArray(target) && target === prevTarget[key]) {
            delEmptys.set(target, { key, prevTarget })
          }
          delete target[lastKey]
          break
      }
    }
  }

  delEmptys.forEach(({ key, prevTarget }, target) => {
    const clone = new target.constructor()
    // filter empty item
    target.forEach(item => clone.push(item))
    prevTarget[key] = clone
  })

  return obj
}