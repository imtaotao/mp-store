import {
  warn,
  remove,
  mapObject,
  mergeState,
  assertError,
  isPlainObject,
} from './utils'
import Router from './middleware'
import updateComponent from './update'

// global state namespace
export let GLOBALWORD = 'global'

const assertReducer = (state, action, reducer) => {
  const { setter, partialState } = reducer

  assertError(
    !('partialState' in reducer),
    `You must defined "partialState" of "${action}".`,
  )

  assertError(
    !partialState || typeof partialState !== 'object',
    `The partialState of "${action}" must be an object.`,
  )

  for (const key in partialState) {
    assertError(
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
    this.router = new Router(this)
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
    assertError(
      isDispatching,
      'It is not allowed to call "dispatch" during dispatch execution.' +
        `\n\n   --- from [${action}] action.`
    )

    const reducer = reducers.find(v => v.action === action)

    assertError(
      !reducer,
      `The "${action}" does not exist. ` +
        'Maybe you have not defined.'
    )

    this.isDispatching = true
    let newPartialState = null

    try {
      newPartialState = reducer.setter(this.state, payload)
      this.state = mergeState(this.state, newPartialState)
    } catch (err) {
      // if call setter function throw an error,
      // the `isDispatching` need restore.
      isDispatching = false
      warn(`${err}\n\n   --- from [${action}] action.`)
    }

    // update components
    updateComponent(this.depComponents, this.hooks)
    isDispatching = false
  }

  // add middleware
  use (action, fn) {
    if (typeof action !== 'string') {
      fn = action
      action = '/'
    }

    if (typeof action === 'string' && typeof fn === 'function') {
      this.router.use(match, fn)
    }
  }

  // allow change `GLOBALWORD`.
  setNamespace (key) {
    if (typeof key === 'string') {
      GLOBALWORD = key
    }
  }

  // insert method
  _rewirteCfgAndAddDep (config, isPage) {
    const store = this
    const { data, storeConfig = {} } = config
    const { didUpdate, willUpdate, defineReducer, defineGlobalState } = storeConfig

    data 
      ? data[GLOBALWORD] = {}
      : config.data = { [GLOBALWORD]: {} }

    // this is a uitl method,
    // allow craete reducer in the page or component.
    if (typeof defineReducer === 'function') {
      defineReducer.call(store, store)
      delete config.storeConfig
    }

    const addDep = component => {
      // if no used global state word,
      // no need to add dependencies.
      if (typeof defineGlobalState === 'function') {
        const defineObject = defineGlobalState.call(store, store)
        const createState = () => mapObject(defineObject, fn => fn(this.state))

        // get state used by the current component
        const usedState = createState()

        if (isPlainObject(usedState)) {
          // add component to depComponents
          this.depComponents.push({
            isPage,
            component,
            didUpdate,
            willUpdate,
            createState,
          })

          // set global state to view
          component.setData({ [GLOBALWORD]: usedState })
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