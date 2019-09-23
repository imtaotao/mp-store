import { warn } from './utils'

const match = (layer, action) => {
  if (action === '/') return true
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

  handle (action, payload) {
    const len = this.stack.length

    if (len > 0) {
      let idx = 0
      const next = prevPayload => {
        let layer = this.stack[idx]

        while (layer && !match(layer, action)) {
          layer = this.stack[++idx]
        }

        if (layer) {
          try {
            layer.fn.call(this.store, prevPayload, next)
          } catch (err) {
            warn(`${err}\n\n   --- from [${action}] action.`)
          }
        }
      }

      next(payload)
    }
  }
}