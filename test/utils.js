// set global env function
window.Page = function () {}
window.Component = function () {}

export const isError = fn => {
  try {
    fn()
  } catch (err) {
    return true
  }
  return false
}

export const expectPatch = (patchs, path, val, type) => {
  const patch = patchs.find(patch => patch.path === path)
  if (patch) {
    expect(patch.type).toBe(type)
    expect(patch.path).toBe(path)
    expect(patch.value).toBe(val)
  } else {
    throw Error(`test failed\n\n--- from [${path}].\n`)
  }
}

export const clone = (obj, record = new WeakMap()) => {
  if (!obj) return obj
  if (obj instanceof Date) return obj
  if (record.has(obj)) return record.get(obj)

  const filterTypes = ['string', 'number', 'boolean', 'function']
  if (filterTypes.includes(typeof obj)) return obj

  const res = typeof obj.constructor !== 'function'
    ? Object.create(null) 
    : new obj.constructor()

  record.set(obj, res)

  for (const key in obj) {
    res[key] = clone(obj[key], record)
  }
  return res
}

export const isRangeTime = (time, duration, deviation = 10) => {
  const result = time - duration
  return result > -deviation && result < deviation
}