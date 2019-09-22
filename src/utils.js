export const assertError = (condition, message) => {
  if (condition) {
    throw new Error(`\nMpstore warn: ${message}\n\n`)
  }
}

export const isEmptyObject = obj => {
  for (const key in obj)
    return false
  return true
}

export const mergeState = (oldState, newState) => {
  return Object.freeze({ ...oldState, ...newState })
}

export const remove = (list, item) => {
  const index = list.indexOf(item)
  if (index > -1) {
    list.splice(index, 1)
  }
}

// Parse simple path.
const bailRE = /[^\w.$]/
export const parsePath = path => {
  if (bailRE.test(path)) return
  const segments = path.split('.')
  return obj => {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      obj = obj[segments[i]]
    }
    return obj
  }
}

export const diff = (left, right) => {

}