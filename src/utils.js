export function warning (message, noError) {
  message = `\n\n[MpStore warning]: ${message}\n\n`
  if (noError) {
    console.warn(message)
    return
  }
  throw new Error(message)
}

export function assert (condition, message) {
  if (!condition) warning(message)
}

export function isPrimitive (value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}

export function deepFreeze (state) {
  const names = Object.getOwnPropertyNames(state)
  let len = names.length
  while (~len--) {
    const value = state[names[len]]
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value)
    }
  }
  return Object.freeze(state)
}

export function mergeState (oldState, newState) {
  return deepFreeze(Object.assign({}, oldState, newState))
}

export function mixinMethods (config, methods) {
  for (const key in methods) {
    if (!(key in config)) {
      config[key] = methods[key]
    }
  }
}

// remove component from depsComponent
export function remove (list, component) {
  const index = list.findIndex(item => item.component === component)
  if (index > -1) {
    list.splice(index, 1)
  }
}

export function callHook (hooks, name, args) {
  if (hooks && typeof hooks[name] === 'function') {
    return hooks[name].apply(hooks, args)
  }
}

export function isEmptyObject (obj) {
  for (const k in obj){
    return false
  }
  return true
}

export function mapObject (obj, fn) {
  const destObject = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      destObject[key] = fn(obj[key])
    }
  }
  return destObject
}

export function createWraper (target, before, after) {
  return function (...args) {
    let result

    if (typeof before === 'function') {
      before.apply(this, args)
    }

    if (typeof target === 'function') {
      result = target.apply(this, args)
    }

    if (typeof after === 'function') {
      after.apply(this, args)
    }

    return result
  }
}

export function isPlainObject (obj) {
  if (typeof obj !== 'object' || obj === null) return false

  const proto = Object.getPrototypeOf(obj)
  if (proto === null) return true

  let baseProto = proto
  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto)
  }
  return proto === baseProto
}

export function clone (value, record = new WeakMap) {
  if (
    value === null ||
    value === undefined ||
    isPrimitive(value) ||
    typeof value === 'function' ||
    value instanceof Date
  ) {
    return value
  }

  if (record.has(value)) return record.get(value)

  const result = typeof value.constructor !== 'function'
    ? Object.create(null) 
    : new value.constructor()

  record.set(value, result)

  for (const key in value) {
    result[key] = clone(value[key], record)
  }

  return result
}

// parse simple path
export function parsePath (path) {
  const segments = path.split('.')
  return function (obj) {
    for (let i = 0, len = segments.length; i < len; i++) {
      if (!obj) return
      obj = obj[segments[i]]
    }
    return obj
  }
}