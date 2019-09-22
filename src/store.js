import {
  remove,
  parsePath,
  mergeState,
  assertError,
} from './utils'
import updateComponent from './update'

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
      throw new Error(
        `Can\'t set "${action}" value. ` +
          'Have you defined a setter?\n\n'
      )
    }
  }

  return reducer
}

export default class Store {
  constructor () {
    this.state = {}
    this.reducers = []
    this.depComponents = []
    this.isDispatching = false
  }

  add (action, reducer) {
    const { partialState } = assertReducer(this.state, action, reducer)

    reducer.action = action
    this.reducers.push(reducer)
    this.state = mergeState(this.state, partialState)
  }

  dispatch (action, payload) {
    const { reducers, isDispatching } = this

    // If we in call dispatch process,
    // We don't allow call dispacth again
    assertError(
      isDispatching,
      'It is not allowed to call "dispatch" during dispatch execution.'
        + `\n\n   --- from [${action}] action.`
    )
    
    const reducer = reducers.find(v => v.action === action)

    assertError(
      !reducer,
      `The "${action}" does not exist. ` +
        'Maybe you have not defined.'
    )

    let newPartialState = null
    this.isDispatching = true
    
    try {
      newPartialState = reducer.setter(payload)
      this.state = mergeState(this.state, newPartialState)
    } catch (err) {
      // If call setter hook throw an error
      // The `isDispatching` will restore
      isDispatching = false
      throw new Error(`${err}\n\n   --- from [${action}] action.`)
    }

    // Update components
    updateComponent(this.depComponents, newPartialState)
    isDispatching = false
  }

  // Insert api
  _rewirteCfgAndAddDep (config, isPage) {
    const store = this
    const { data, defineReducer, defineGlobalState } = config

    data 
      ? data.global = {}
      : config.data = { global: {} }

    // This is a uitl method
    // Allow craete reducer in the page or component
    if (typeof defineReducer === 'function') {
      defineReducer.call(store, store)
      delete config.defineReducer
    }

    const addDep = component => {
      // If no used global state word
      // No need to add dependencies
      if (typeof defineGlobalState === 'function') {
        const usedState = defineGlobalState.call(store, this.state)
        const usedWords = Object.keys(usedState)

        // This is functions of get state
        getValues = usedWords.map(key => parsePath(usedState[key]))

        const createState = () => {
          const state = {}
          usedWords.forEach((key, i) => {
            state[key] = getValues[i](this.state)
          })
          return state
        }

        // Rigister component to depComponents
        this.depComponents.push({
          isPage,
          usedWords,
          component,
          createState,
        })

        // Set global state to view
        component.setData({ global: createState() })
      }
    }

    if (isPage) {
      const nativeLoad = config.onLoad
      const nativeUnload = config.onUnload
      
      config.onLoad = function (opts) {
        addDep(this)

        // Rigister store to component within
        this.store = store
        if (typeof nativeLoad === 'function') {
          nativeLoad.call(this, opts)
        }
      }

      config.onUnload = function (opts) {
        if (typeof nativeUnload === 'function') {
          nativeUnload.call(this, opts)
        }

        // Clear cache
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