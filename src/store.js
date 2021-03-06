import {
  clone,
  assert,
  remove,
  warning,
  callHook,
  mapObject,
  mergeState,
  deepFreeze,
  createWraper,
  isPlainObject,
  isEmptyObject,
} from './utils'

import {
  getModule,
  mergeModule,
  createModule,
  createModuleByNamespace,
} from './module'

import { diff } from './diff'
import TimeTravel from './time-travel'
import defaultOption from './default-option'
import { applyPatchs, asyncUpdate } from './update'
import { Middleware, COMMONACTION } from './middleware'

// Each `store` instance has a unique id
let storeId = 0

function assertReducer (action, reducer) {
  const { setter, partialState } = reducer
  const stringifyAction = action.toString()

  assert(
    !('partialState' in reducer && !isPlainObject(partialState)),
    `The [partialState] must be an object.` +
      `\n\n --- from [${stringifyAction}] action.`,
  )

  if (typeof setter !== 'function') {
    reducer.setter = () => {
      warning(
        `Can\'t changed [${stringifyAction}] action value. Have you defined a setter?` +
          `\n\n --- from [${stringifyAction}] action.`
      )
    }
  }
  return reducer
}

function filterReducer (state, action, reducer, env) {
  const stringifyAction = action.toString()
  const { namespace, partialState } = reducer

  if ('namespace' in reducer) {
    assert(
      typeof namespace === 'string',
      'The module namespace must be a string.' +
        `\n\n --- from [${stringifyAction}] action.`,
    )
    
    reducer.partialState = createModuleByNamespace(
      namespace,
      partialState,
      state,
      stringifyAction,
      (key, moduleName) => `The [${key}] already exists in [${moduleName}] module, ` +
        `Please don't repeat defined. \n\n --- from [${stringifyAction}] action.`,
      env,
    )
  } else {
    if (env === 'develop') {
      // inspect all state key 
      for (const key in partialState) {
        assert(
          !state.hasOwnProperty(key),
          `The [${key}] already exists in global state, ` +
            `Please don't repeat defined. \n\n --- from [${stringifyAction}] action.`,
        )
      }
    }
  }
  return reducer
}

export class Store {
  constructor (hooks, options = {}) {
    this.hooks = hooks
    this.reducers = []
    this.id = ++storeId
    this.depComponents = []
    this.isDispatching = false
    this.restoreCallbacks = []
    this.dispatchCallbacks = []
    this.version = __VERSION__
    this.state = Object.freeze(createModule({}))
    this.middleware = new Middleware(this)
    this.options = Object.assign({}, defaultOption, options)
    this.GLOBALWORD = this.options.globalNamespace // global state namespace
  }

  add (action, reducer) {
    const env = this.options.env

    if (env === 'develop') {
      const actionType = typeof action
      assert(
        actionType === 'string' || actionType === 'symbol',
        `The action must be a Symbol or String, but now is [${actionType}].`,
      )
      assert(
        !this.reducers.find(v => v.action === action),
        `Can't repeat defined [${action.toString()}] action.`,
      )
    }

    // record initial state
    const originPartialState = reducer.partialState
    if (env === 'develop') {
      assertReducer(action, reducer)
    }
    filterReducer(this.state, action, reducer, env)

    reducer.action = action
    this.reducers.push(reducer)
    const { partialState } = reducer

    // we filter the symbol when we diff, so we don't need to detect
    if (partialState && !isEmptyObject(partialState)) {
      // because we don't allow duplicate fields to be created,
      // so don't need to use `mergeModule`
      this.state = mergeState(this.state, partialState, env)
    }

    // toggle to initial state
    reducer.partialState = originPartialState
  }

  dispatch (action, payload, callback) {
    const {
      reducers,
      isDispatching,
      options: { env },
    } = this
    const stringifyAction = action.toString()

    // if we in call dispatch process,
    // we don't allow call dispacth again.
    if (env === 'develop') {
      assert(
        !isDispatching,
        'It is not allowed to call "dispatch" during dispatch execution.' +
          `\n\n   --- from [${stringifyAction}] action.`
      )
    }

    // call all middleware
    this.middleware.process(action, payload, (destPayload, restoreProcessState) => {
      this.isDispatching = true

      try {
        const reducer = reducers.find(v => v.action === action)
        if (env === 'develop') {
          assert(
            reducer,
            `The [${stringifyAction}] action does not exist. ` +
              'Maybe you have not defined.'
          )
        }

        let newPartialState
        const namespace = reducer.namespace
        const isModuleDispatching = typeof namespace === 'string'

        if (isModuleDispatching) {
          // generate new partial state
          const module = this.getModule(namespace, `\n\n --- from [${stringifyAction}] action.`)
          newPartialState = reducer.setter(module, destPayload, this.state)
        } else {
          newPartialState = reducer.setter(this.state, destPayload)
        }

        if (env === 'develop') {
          assert(
            isPlainObject(newPartialState),
            'setter function should be return a plain object.',
          )
        }

        // update global state
        if (!isEmptyObject(newPartialState)) {
          if (isModuleDispatching) {
            // create new partialState and merge modules
            newPartialState = createModuleByNamespace(
              namespace,
              newPartialState,
              this.state,
              stringifyAction,
              null,
              env,
            )
            this.state = mergeState(this.state, newPartialState, env)
          } else {
            const newState = mergeModule(this.state, newPartialState, null, null, env)
            this.state = env === 'develop' 
              ? newState
              : deepFreeze(newState)
          }
        }
      } finally {
        // the `isDispatching` need restore.
         this.isDispatching = false
        // restore state
        restoreProcessState()
      }

      // update components
      asyncUpdate(this, 'dispatchCallbacks', () => {
        if (typeof callback === 'function') {
          callback(destPayload)
        }
      })
    })
  }

  // restore to init state
  restore (action, callback, notUpdate) {
    const env = this.options.env
    const reducer = this.reducers.find(v => v.action === action)
    const stringifyAction = action.toString()

    if (env === 'develop') {
      assert(
        reducer,
        `The [${stringifyAction}] action does not exist. ` +
          'Maybe you have not defined.'
      )
    }

    const { namespace, partialState } = reducer

    if (env === 'develop') {
      assert(
        isPlainObject(partialState),
        'no initialized state, do you have a definition?' +
          `\n\n   --- from [${stringifyAction}] action.`
      )
    }
    
    // set state
    if (typeof namespace === 'string') {
      const newPartialState = createModuleByNamespace(
        namespace,
        partialState,
        this.state,
        stringifyAction,
        env,
      )
      this.state = mergeState(this.state, newPartialState, env)
    } else {
      const newState = mergeModule(this.state, partialState, null, null, env)
      this.state = env === 'develop'
        ? newState
        : deepFreeze(newState)
    }

    if (notUpdate) {
      callback(partialState)
    } else {
      // update components
      asyncUpdate(this, 'restoreCallbacks',  () => {
        if (typeof callback === 'function') {
          callback(partialState)
        }
      })
    }
  }

  forceUpdate () {
    asyncUpdate(this, null, COMMONACTION)
  }

  // add middleware
  use (action, fn) {
    if (typeof action === 'function' && action !== COMMONACTION) {
      fn = action
      action = COMMONACTION
    }

    this.middleware.use(action, fn)
    return () => this.middleware.remove(action, fn)
  }

  // allow change `GLOBALWORD`.
  setNamespace (key) {
    if (this.options.env === 'develop') {
      assert(
        key && typeof key === 'string',
        'The [namespace] must be a string',
      )
      console.error(
        'The `setNamespace` is deprecated, ' +
          'please use options to specify.'
      )
    }
    this.options.globalNamespace = this.GLOBALWORD = key
  }

  // get module
  getModule (namespace, remainMsg) {
    const env = this.options.env
    if (env === 'develop') {
      assert(
        typeof namespace === 'string',
        'the namespace mast be a string',
      )
    }

    if (!namespace) {
      return this.state
    }

    // deal with module state
    const module = getModule(this.state, namespace)
    // if the module does not meet the requirements
    // throw error
    if (remainMsg && module === null) {
      if (env === 'develop') {
        warning(`The [${namespace}] module is not exist.${remainMsg || ''}`)
      }
    }
    return module
  }

  addModule (namespace, reducers) {
    if (this.options.env === 'develop') {
      assert(
        typeof namespace === 'string',
        'the namespace mast be a string',
      )
    }

    if (isPlainObject(reducers)) {
      // Todo: replace to `Reflect.ownKeys`
      const keys = Object.keys(reducers)
      const symbols = Object.getOwnPropertySymbols(reducers)

      if (keys.length + symbols.length > 0) {
        let i = 0
        const addRecucer = action => {
          const reducer = reducers[action]
          reducer.namespace = namespace
          this.add(action, reducer)
        }
      
        for (; i < keys.length; i++) {
          addRecucer(keys[i])
        }
        
        for (i = 0; i < symbols.length; i++) {
          addRecucer(symbols[i])
        }
      }
    }
  }

  // insert method
  rewirteConfigAndAddDep (config, isPage) {
    let createState = null
    const store = this
    const GLOBALWORD = this.GLOBALWORD

    const {
      data,
      storeConfig = {},
    } = config

    const {
      env,
      storeNamespace,
    } = this.options

    const {
      addDep,
      useState,
      didUpdate,
      willUpdate,
      defineReducer,
      travelLimit = 0, // default not open time travel function
    } = storeConfig

    if (env === 'develop') {
      assert(
        typeof travelLimit === 'number',
        `[travelLimit] must be a number, but now is [${typeof travelLimit}].`
      )
    }

    delete config.storeConfig

    // this is a uitl method,
    // allow craete reducer in the page or component.
    if (typeof defineReducer === 'function') {
      defineReducer.call(store, store)
    }

    // get the global state words used
    if (typeof useState === 'function') {
      let namespace = null
      let defineObject = null
      const useConfig = useState.call(store, store)

      // inspect should need module state
      if (Array.isArray(useConfig)) {
        namespace = useConfig[0]
        defineObject = useConfig[1]
      } else {
        defineObject = useConfig
      }

      if (env === 'develop') {
        assert(
          isPlainObject(defineObject),
          '[useState] must return a plain object, ' +
            `but now is return a [${typeof defineObject}]`,
        )
      }
      
      // need deep clone, otherwise the `data.global` on the back of the component cannot be changed.
      if (namespace === null) {
        createState = () => clone(mapObject(defineObject, fn => fn(store.state)))
      } else {
        createState = () => {
          const module = this.getModule(namespace, `\n\n   --- from [${namespace}] of useState.`)
          return clone(mapObject(defineObject, fn => fn(module, store.state)))
        }
      }
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

    const addDepToStore = component => {
      // self hook
      if (typeof addDep === 'function') {
        if (addDep.call(store, component, isPage) === false) {
          return
        }
      }

      // global hook
      const shouldAdd = callHook(this.hooks, 'addDep', [component, isPage])
      // if no used global state word,
      // no need to add dependencies.
      if (shouldAdd !== false && createState !== null) {
        if (component.data && isPlainObject(component.data[GLOBALWORD])) {
          // time travel can record diff patchs
          component.timeTravel = new TimeTravel(component, GLOBALWORD, travelLimit, env)

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

    function onLoad () {
      addDepToStore(this)
      // rigister store to component within
      this[storeNamespace] = store
      this._$loaded = true
    }

    function onUnload () {
      this._$loaded = false
      // clear cache
      remove(store.depComponents, this)
    }

    if (isPage) {
      config.onLoad = createWraper(config.onLoad, onLoad, null)
      config.onUnload = createWraper(config.onUnload, null, onUnload)
    } else {
      // Component
      config.lifetimes = config.lifetimes || {}
      const get = name => config[name] || config.lifetimes[name]
      const set = (name, fn) => config[name] = config.lifetimes[name] = fn

      set('attached', createWraper(get('attached'), onLoad, null))
      set('detached', createWraper(get('detached'), null, onUnload))
    }
  }
}