export const COMMONACTION = '*'

const match = (layer, action) => {
  if (action === COMMONACTION) return true
  return action === layer.action
}

function Layer (action, fn) {
  this.fn = fn
  this.action = action
}

// deal with all middleware
export default class Router {
  constructor (store) {
    this.stack = []
    this.store = store
  }

  use (action, fn) {
    this.stack.push(new Layer(action, fn))
  }

  remove (action, fn) {
    const index = this.stack.findIndex(layer => {
      return layer.fn === fn && layer.action === action
    })

    if (index > -1) {
      this.stack.splice(index, 1)
    }
  }

  handle (action, payload) {
    if (this.stack.length > 0) {
      let idx = 0
      const next = prevPayload => {
        let layer = this.stack[idx]

        while (layer && !match(layer, action)) {
          layer = this.stack[++idx]
        }

        if (layer) {
          layer.fn.call(this.store, prevPayload, next)
        }
      }

      next(payload)
    }
  }
}