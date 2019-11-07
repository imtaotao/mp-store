import {
  clone,
  assert,
  remove,
  callHook,
  mapObject,
  mergeState,
  createWraper,
  isPlainObject,
  isEmptyObject,
} from './utils'
import { diff } from './diff'
import TimeTravel from './time-travel'
import { Middleware, COMMONACTION } from './middleware'
import { applyPatchs, updateComponents } from './update'

// Each `store` instance has a unique id
let storeId = 0

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
    this.hooks = hooks
    this.reducers = []
    this.id = ++storeId
    this.depComponents = []
    this.GLOBALWORD = 'global' // global state namespace
    this.isDispatching = false
    this.version = __VERSION__
    this.state = Object.freeze({})
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
    if (!isEmptyObject(partialState)) {
      this.state = mergeState(this.state, partialState)
    }
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
      `The [${action}] action does not exist. ` +
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
        
        if (!isEmptyObject(newPartialState)) {
          this.state = mergeState(this.state, newPartialState)
        }
      } finally {
        // the `isDispatching` need restore.
         this.isDispatching = false
        // restore state
        restoreProcessState()
      }

      // update components
      updateComponents(this)

      if (typeof callback === 'function') {
        callback()
      }
    })
  }

  // add middleware
  use (action, fn) {
    if (
      typeof action === 'function' &&
      action !== COMMONACTION
    ) {
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
    this.GLOBALWORD = key
  }

  // insert method
  rewirteCfgAndAddDep (config, isPage) {
    let createState = null
    const store = this
    const GLOBALWORD = this.GLOBALWORD
    const { data, storeConfig = {} } = config
    const {
      useState,
      didUpdate,
      willUpdate,
      defineReducer,
      travelLimit = 0, // default not open time travel function
    } = storeConfig

    assert(
      typeof travelLimit === 'number',
      `[travelLimit] must be a number, but now is [${typeof travelLimit}].`
    )

    delete config.storeConfig

    // this is a uitl method,
    // allow craete reducer in the page or component.
    if (typeof defineReducer === 'function') {
      defineReducer.call(store, store)
    }

    // get the global state words used
    if (typeof useState === 'function') {
      const defineObject = useState.call(store, store)

      assert(
        isPlainObject(defineObject),
        '[useState] must return a plain object, ' +
          `but now is return a [${typeof defineObject}]`,
      )
      
      // need deep clone, otherwise the `data.global` on the back of the component cannot be changed.
      createState = () => clone(mapObject(defineObject, fn => fn(store.state)))
    }

    // get state used by the current component
    if (createState !== null) {
      const useState = createState()
      if (isPlainObject(useState)) {
        data 
          ? data[GLOBALWORD] = useState
          : config.data = { [GLOBALWORD]: useState }
      }
    }

    const addDep = component => {
      const shouldAdd = callHook(this.hooks, 'addDep', [component, isPage])

      // if no used global state word,
      // no need to add dependencies.
      if (shouldAdd !== false && createState !== null) {
        if (component.data && isPlainObject(component.data[GLOBALWORD])) {
          // time travel can record diff patchs
          component.timeTravel = new TimeTravel(component, GLOBALWORD, travelLimit)

          // add component to depComponents
          this.depComponents.push({
            isPage,
            component,
            didUpdate,
            willUpdate,
            createState,
          })

          // if the global state is changed, need update component
          const patchs = diff(component.data[GLOBALWORD], createState(), GLOBALWORD)
          if (patchs.length > 0) {
            applyPatchs(component, patchs, GLOBALWORD)
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
        config.onUnload,
        null,
        function () {
          // clear cache
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
          remove(store.depComponents, this)
        },
      ))
    }
  }
}