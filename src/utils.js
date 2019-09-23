export const warn = message => {
  throw new Error(`\n[MpStore warn]: ${message}\n\n`)
}

export const assertError = (condition, message) => {
  if (condition) warn(message)
}

export const mergeState = (oldState, newState) => {
  return Object.freeze({ ...oldState, ...newState })
}

export const isEmptyObject = obj => {
  for (const key in obj)
    return false
  return true
}

export const remove = (list, item) => {
  const index = list.indexOf(item)
  if (index > -1) {
    list.splice(index, 1)
  }
}

export const callHook = (hooks, name, args) => {
  if (hooks && typeof hooks[name] === 'function') {
    return hooks[name].apply(hooks, args)
  }
}

export const mapObject = (obj, fn) => {
  const desObject = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      desObject[key] = fn(obj[key])
    }
  }
  return desObject
}

export const isPlainObject = obj => {
  if (typeof obj !== 'object' || obj === null) return false

  const proto = Object.getPrototypeOf(obj)
  if (proto === null) return true

  let baseProto = proto
  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto)
  }
  return proto === baseProto
}