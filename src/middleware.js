import { warning, assert } from './utils'

export const COMMONACTION = () => {}

/**
 * use((payload, next) => {})
 * use(action, (payload, next) => {})
 * use([action, action], (payload, next) => {})
 */
function match (layer, action) {
  if (layer.action === COMMONACTION) {
    return true
  }
  if (Array.isArray(layer.action)) {
    return layer.action.indexOf(action) > -1
  }
  return action === layer.action
}

function handleLayer (
  action,
  fn,
  store,
  payload,
  next,
  restoreProcessState,
) {
  try {
    fn.call(store, payload, next, action)
    restoreProcessState()
  } catch (error) {
    const hooks = store.hooks
    restoreProcessState()

    // if the error hook exist, don't throw error
    if (hooks && typeof hooks['middlewareError'] === 'function') {
      hooks['middlewareError'](action, payload, error)
    } else {
      if (store.options.env === 'develop') {
        warning(`${error}\n\n   --- from middleware [${action.toString()}] action.`)
      }
    }
  }
}

// deal with all middleware
export class Middleware {
  constructor (store) {
    this.stack = []
    this.store = store
    this.isProcessing = false
  }

  use (action, fn) {
    if (this.store.options.env === 'develop') {
      assert(
        !this.isProcessing,
        'can\'t allow add new middleware in the middleware processing.'
      )
    }
    this.stack.push({ fn, action })
  }

  remove (action, fn) {
    const index = this.stack.findIndex(layer => {
      return layer.fn === fn && layer.action === action
    })

    if (index > -1) {
      this.stack.splice(index, 1)
    }
  }

  process (action, payload, finish) {
    // can't allow add new middleware in the middleware processing and setter function
    this.isProcessing = true
    const restoreProcessState = () => {
      this.isProcessing = false
    }

    if (this.stack.length > 0) {
      let index = 0
      const next = prevPayload => {
        let layer = this.stack[index]

        index++

        while (layer && !match(layer, action)) {
          layer = this.stack[index++]
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