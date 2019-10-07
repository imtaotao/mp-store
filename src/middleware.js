import { warn, assert } from './utils'

export const COMMONACTION = '*'

const match = (layer, action) => {
  if (layer.action === COMMONACTION) return true
  return action === layer.action
}

const handleLayer = (
    action,
    fn,
    store,
    payload,
    next,
    restoreProcessState,
) => {
  try {
    fn.call(store, payload, next, action)
    restoreProcessState()
  } catch (error) {
    const hooks = store.hooks
    restoreProcessState()

    // if the error hook exist, don't throw error
    if (hooks && typeof hooks['middlewareError'] === 'function') {
      hooks['middlewareError'](action, payload, err)
    } else {
      warn(`${error}\n\n   --- from middleware [${action}] action.`)
    }
  }
}

// deal with all middleware
export default class Middleware {
  constructor (store) {
    this.stack = []
    this.store = store
    this.isProcessing = false
  }

  use (action, fn) {
    assert(
      !this.isProcessing,
      'can\'t allow add new middleware in the middleware processing.'
    )
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

  process (action, payload, finish) {
    // can't allow add new middleware in the middleware processing and setter function
    this.isProcessing = true
    const restoreProcessState = () => {
      this.isProcessing = false
    }

    if (this.stack.length > 0) {
      let idx = 0
      const next = prevPayload => {
        let layer = this.stack[idx]

        idx++

        while (layer && !match(layer, action)) {
          layer = this.stack[idx++]
        }

        if (layer) {
          // put `try catch` in a separate function,
          // avoid the entire function not being optimized.
          handleLayer(
            action,
            layer.fn,
            this.store,
            prevPayload,
            next,
            restoreProcessState,
          )
        } else {
          finish(prevPayload, restoreProcessState)
        }
      }

      next(payload)
    } else {
      finish(payload, restoreProcessState)
    }
  }
}