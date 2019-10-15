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

export const isRangeTime = (time, duration, deviation = 30) => {
  const result = time - duration
  return result > -deviation && result < deviation
}