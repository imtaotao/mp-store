export const COMMONACTION = '*'

const match = (layer, action) => {
  if (action === COMMONACTION) return true
  return action === layer.action
}

const handleLayer = (fn, action, store, payload, next) => {
  try {
    fn.call(store, payload, next)
  } catch (err) {
    const hooks = store.hooks

    // if the error hook exist, don't throw error
    if (hooks && typeof hooks['middlewareError'] === 'function') {
      hooks['middlewareError'](action, payload, err)
    } else {
      warn(`${err}\n\n   --- from [${action}] action.`)
    }
  }
}

// deal with all middleware
export default class Middleware {
  constructor (store) {
    this.stack = []
    this.store = store
  }

  use (action, fn) {
    this.stack.push({ fn, action })
  }

  remove (action, fn) {
    const idx = this.stack.findIndex(layer => {
      return layer.fn === fn && layer.action === action
    })

    if (idx > -1) {
      this.stack.splice(idx, 1)
    }
  }

  process (action, payload) {
    if (this.stack.length > 0) {
      let idx = 0
      const next = prevPayload => {
        let layer = this.stack[idx]

        while (layer && !match(layer, action)) {
          layer = this.stack[++idx]
        }

        if (layer) {
          // put `try catch` in a separate function,
          // avoid the entire function not being optimized.
          handleLayer(layer.fn, action, this.store, prevPayload, next)
        }

        idx++
      }

      next(payload)
    }
  }
}