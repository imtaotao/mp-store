import {
  warn,
  assert,
  remove,
  callHook,
  mapObject,
  mergeState,
  isPlainObject,
} from './utils'
import { diff } from './diff'
import Middleware, { COMMONACTION } from './middleware'
import { applyPatchs, updateComponents } from './update'

// global state namespace
export let GLOBALWORD = 'global'

const assertReducer = (state, action, reducer) => {
  const { setter, partialState } = reducer

  assert(
    !('partialState' in reducer),
    `You must defined "partialState" of "${action}".`,
  )

  assert(
    !partialState || typeof partialState !== 'object',
    `The partialState of "${action}" must be an object.`,
  )

  for (const key in partialState) {
    assert(
      state.hasOwnProperty(key),
      `The "${key}" already exists in global state,` +
        'Please don\'t repeat defined.'
    )
  }

  if (typeof setter !== 'function') {
    reducer.setter = () => {
      warn(
        `Can\'t set "${action}" value. ` +
          'Have you defined a setter?'
      )
    }
  }
  return reducer
}

export default class Store {
  constructor (hooks) {
    this.state = {}
    this.hooks = hooks
    this.reducers = []
    this.depComponents = []
    this.isDispatching = false
    this.middleware = new Middleware(this)
  }

  add (action, reducer) {
    const { partialState } = assertReducer(this.state, action, reducer)

    reducer.action = action
    this.reducers.push(reducer)
    this.state = mergeState(this.state, partialState)
  }

  dispatch (action, payload) {
    const { reducers, isDispatching } = this

    // if we in call dispatch process,
    // we don't allow call dispacth again.
    assert(
      isDispatching,
      'It is not allowed to call "dispatch" during dispatch execution.' +
        `\n\n   --- from [${action}] action.`
    )

    const reducer = reducers.find(v => v.action === action)

    assert(
      !reducer,
      `The "${action}" does not exist. ` +
        'Maybe you have not defined.'
    )

    const fn = prevPayload => {
      this.isDispatching = true

      // the current function is called only once
      this.middleware.remove(action, fn)
      
      try {
        const newPartialState = reducer.setter(this.state, prevPayload)
        this.state = mergeState(this.state, newPartialState)
      } catch (err) {
        // if call setter function throw an error,
        // the `isDispatching` need restore.
        this.isDispatching = false
        warn(`${err}\n\n   --- from [${action}] action setter.`)
      }
      
      // update components
      updateComponents(this.depComponents, this.hooks)

      this.isDispatching = false
    }

    // add setter fn to middleware
    this.middleware.use(action, fn)

    // call all middleware
    this.middleware.process(action, payload)
  }

  // add middleware
  use (action, fn) {
    if (typeof action !== 'string') {
      fn = action
      action = COMMONACTION
    }

    this.middleware.use(action, fn)
    return () => this.middleware.remove(action, fn)
  }

  // allow change `GLOBALWORD`.
  setNamespace (key) {
    if (typeof key === 'string') {
      GLOBALWORD = key
    }
  }

  // insert method
  _rewirteCfgAndAddDep (config, isPage) {
    let createState = null
    const store = this
    const { data, storeConfig = {} } = config
    const { didUpdate, willUpdate, defineReducer, defineGlobalState } = storeConfig

    // this is a uitl method,
    // allow craete reducer in the page or component.
    if (typeof defineReducer === 'function') {
      defineReducer.call(store, store)
      delete config.storeConfig
    }

    // get the global state words used
    if (typeof defineGlobalState === 'function') {
      const defineObject = defineGlobalState.call(store, store)
      createState = () => mapObject(defineObject, fn => fn(this.state))
    }

    // get state used by the current component
    if (createState !== null) {
      const usedState = createState()
      if (isPlainObject(usedState)) {
        data 
          ? data[GLOBALWORD] = usedState
          : config.data = { [GLOBALWORD]: usedState }
      }
    }

    const addDep = component => {
      const shouldAdd = callHook(this.hooks, 'addDep', [component, isPage])

      // if no used global state word,
      // no need to add dependencies.
      if (shouldAdd !== false && createState !== null) {
        if (isPlainObject(component.data[GLOBALWORD])) {
          // add component to depComponents
          this.depComponents.push({
            isPage,
            component,
            didUpdate,
            willUpdate,
            createState,
          })

          // if the global state is changed, need update component
          const patchs = diff(component.data[GLOBALWORD], createState())
          if (patchs.length > 0) {
            applyPatchs(component, patchs)
          }
        }
      }
    }

    if (isPage) {
      const nativeLoad = config.onLoad
      const nativeUnload = config.onUnload

      config.onLoad = function (opts) {
        addDep(this)

        // rigister store to component within
        this.store = store
        if (typeof nativeLoad === 'function') {
          nativeLoad.call(this, opts)
        }
      }

      config.onUnload = function (opts) {
        if (typeof nativeUnload === 'function') {
          nativeUnload.call(this, opts)
        }

        // clear cache
        this.store = null
        remove(store.depComponents, this)
      }
    } else {
      // Component
      config.lifetimes = config.lifetimes || {}
      const nativeAttached = config.attached || config.lifetimes.attached
      const nativeDetached = config.detached || config.lifetimes.detached

      config.attached =
      config.lifetimes.attached = function (opts) {
        addDep(this)
        this.store = store

        if (typeof nativeAttached === 'function') {
          nativeAttached.call(this, opts)
        }
      }

      config.detached =
      config.lifetimes.detached = function (opts) {
        if (typeof nativeDetached === 'function') {
          nativeDetached.call(this, opts)
        }

        this.store = null
        remove(store.depComponents, this)
      }
    }
  }
}