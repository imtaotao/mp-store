import {
  warn,
  assert,
  remove,
  callHook,
  mapObject,
  mergeState,
  createWraper,
  isPlainObject,
} from './utils'
import { diff } from './diff'
import { Middleware, COMMONACTION } from './middleware'
import { applyPatchs, updateComponents } from './update'

// Each `store` instance has a unique id
let storeId = 0

// global state namespace
export let GLOBALWORD = 'global'

function assertReducer (state, action, reducer) {
  const { setter, partialState } = reducer

  assert(
    'partialState' in reducer,
    `You must defined [partialState].` + 
      `\n\n --- from [${action}] action.`,
  )

  assert(
    isPlainObject(partialState),
    `The [partialState] must be an object.` +
      `\n\n --- from [${action}] action.`,
  )

  for (const key in partialState) {
    assert(
      !state.hasOwnProperty(key),
      `The [${key}] already exists in global state, ` +
        `Please don't repeat defined. \n\n --- from [${action}] action.`
    )
  }

  if (typeof setter !== 'function') {
    reducer.setter = () => {
      throw `Can\'t changed [${action}] action value. Have you defined a setter?`
    }
  }
  return reducer
}

export class Store {
  constructor (hooks) {
    this.state = {}
    this.hooks = hooks
    this.reducers = []
    this.id = ++storeId
    this.depComponents = []
    this.isDispatching = false
    this.version = __VERSION__
    this.middleware = new Middleware(this)
  }

  add (action, reducer) {
    assert(
      !this.reducers.find(v => v.action === action),
      `Can't repeat defined [${action}] action.`,
    )

    const { partialState } = assertReducer(this.state, action, reducer)

    reducer.action = action
    this.reducers.push(reducer)
    this.state = mergeState(this.state, partialState)
  }

  dispatch (action, payload, callback) {
    const { reducers, isDispatching } = this

    // if we in call dispatch process,
    // we don't allow call dispacth again.
    assert(
      !isDispatching,
      'It is not allowed to call "dispatch" during dispatch execution.' +
        `\n\n   --- from [${action}] action.`
    )

    const reducer = reducers.find(v => v.action === action)

    assert(
      reducer,
      `The "${action}" does not exist. ` +
        'Maybe you have not defined.'
    )

    // call all middleware
    this.middleware.process(action, payload, (desPayload, restoreProcessState) => {
      this.isDispatching = true

      try {
        const newPartialState = reducer.setter(this.state, desPayload)

        assert(
          isPlainObject(newPartialState),
          'setter function should be return a plain object.',
        )

        this.state = mergeState(this.state, newPartialState)
      } catch (error) {
        // if call setter function throw an error,
        // the `isDispatching` need restore.
        this.isDispatching = false
        restoreProcessState()
        warn(`${error}\n\n   --- from [${action}] action.`)
      }
      
      // update components
      updateComponents(this.depComponents, this.hooks)

      // restore state
      this.isDispatching = false
      restoreProcessState()

      if (typeof callback === 'function') {
        callback()
      }
    })
  }

  // add middleware
  use (action, fn) {
    if (typeof action === 'function') {
      fn = action
      action = COMMONACTION
    }

    this.middleware.use(action, fn)
    return () => this.middleware.remove(action, fn)
  }

  // allow change `GLOBALWORD`.
  setNamespace (key) {
    assert(
      key && typeof key === 'string',
      'The [namespace] must be a string',
    )
    GLOBALWORD = key
  }

  // insert method
  _rewirteCfgAndAddDep (config, isPage) {
    let createState = null
    const store = this
    const { data, storeConfig = {} } = config
    const { didUpdate, willUpdate, defineReducer, usedGlobalState } = storeConfig

    delete config.storeConfig

    // this is a uitl method,
    // allow craete reducer in the page or component.
    if (typeof defineReducer === 'function') {
      defineReducer.call(store, store)
    }

    // get the global state words used
    if (typeof usedGlobalState === 'function') {
      const defineObject = usedGlobalState.call(store, store)

      assert(
        isPlainObject(defineObject),
        '[usedGlobalState] must return a plain object,' +
          `but now is return a [${typeof defineObject}]`,
      )

      createState = () => mapObject(defineObject, fn => fn(store.state))
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
      config.onLoad = createWraper(
        config.onLoad,
        function () {
          addDep(this)
          // rigister store to component within
          this.store = store
        },
      )
      
      config.onUnload = createWraper(
        config.onLoad,
        null,
        function () {
          // clear cache
          this.store = null
          remove(store.depComponents, this)
        },
      )
    } else {
      // Component
      config.lifetimes = config.lifetimes || {}
      const get = name => config[name] || config.lifetimes[name]
      const set = (name, fn) => config[name] = config.lifetimes[name] = fn

      set('attached', createWraper(
        get('attached'),
        function () {
          addDep(this)
          this.store = store
        },
      ))

      set('detached', createWraper(
        get('detached'),
        null,
        function () {
          this.store = null
          remove(store.depComponents, this)
        },
      ))
    }
  }
}