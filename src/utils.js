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

export const diff = (left, right) => {

}