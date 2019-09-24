export function isError (fn) {
  try {
    fn()
  } catch (err) {
    return true
  }
  return false
}

export function expectPatch (patchs, path, val, type) {
  const patch = patchs.find(patch => patch.path === path)
  if (patch) {
    expect(patch.type).toBe(type)
    expect(patch.path).toBe(path)
    expect(patch.value).toBe(val)
  } else {
    throw Error(`test failed\n\n--- from [${path}].\n`)
  }
}