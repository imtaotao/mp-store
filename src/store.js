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
import { Middleware, COMMONACTION } from './middleware'
import { applyPatchs, updateComponents } from './update'

// Each `store` instance has a unique id
let storeId = 0

function assertReducer (action, reducer) {
  const { setter, partialState } = reducer
  const stringifyAction = action.toString()

  assert(
    'partialState' in reducer,
    `You must defined [partialState].` + 
      `\n\n --- from [${stringifyAction}] action.`,
  )

  assert(
    isPlainObject(partialState),
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

function filterReducer (state, action, reducer) {
  const stringifyAction = action.toString()
  const { namespace, partialState } = reducer

  if ('namespace' in reducer) {
    assert(
      typeof namespace === 'string',
      'The module namespace must be a string.' +
        `\n\n --- from [${stringifyAction}] action.`,
    )
    
    if (!getModule(state, namespace) || !isEmptyObject(partialState)) {
      reducer.partialState = createModuleByNamespace(
        namespace,
        partialState,
        state,
        stringifyAction,
        (key, moduleName) => `The [${key}] already exists in [${moduleName}] module, ` +
          `Please don't repeat defined. \n\n --- from [${stringifyAction}] action.`,
      )
    }
  } else {
    // inspect all state key 
    for (const key in partialState) {
      assert(
        !state.hasOwnProperty(key),
        `The [${key}] already exists in global state, ` +
          `Please don't repeat defined. \n\n --- from [${stringifyAction}] action.`,
      )
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
    this.state = Object.freeze(createModule({}))
    this.middleware = new Middleware(this)
  }

  add (action, reducer) {
    const actionType = typeof action
    assert(
      actionType === 'string' || actionType === 'symbol',
      `The action must be a Symbol or String, but now is [${actionType}].`,
    )

    assert(
      !this.reducers.find(v => v.action === action),
      `Can't repeat defined [${action.toString()}] action.`,
    )
    
    assertReducer(action, reducer)
    filterReducer(this.state, action, reducer)

    reducer.action = action
    this.reducers.push(reducer)
    const { partialState } = reducer

    if (!isEmptyObject(partialState)) {
      // because we don't allow duplicate fields to be created,
      // so don't need to use `mergeModule`
      this.state = mergeState(this.state, partialState)
    }
  }

  dispatch (action, payload, callback) {
    const { reducers, isDispatching } = this
    const stringifyAction = action.toString()

    // if we in call dispatch process,
    // we don't allow call dispacth again.
    assert(
      !isDispatching,
      'It is not allowed to call "dispatch" during dispatch execution.' +
        `\n\n   --- from [${stringifyAction}] action.`
    )

    const reducer = reducers.find(v => v.action === action)

    assert(
      reducer,
      `The [${stringifyAction}] action does not exist. ` +
        'Maybe you have not defined.'
    )

    // call all middleware
    this.middleware.process(action, payload, (destPayload, restoreProcessState) => {
      this.isDispatching = true

      try {
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

        assert(
          isPlainObject(newPartialState),
          'setter function should be return a plain object.',
        )

        // update global state
        if (!isEmptyObject(newPartialState)) {
          if (isModuleDispatching) {
            // create new partialState and merge modules
            newPartialState = createModuleByNamespace(
              namespace,
              newPartialState,
              this.state,
              stringifyAction,
            )
            this.state = mergeState(this.state, newPartialState)
          } else {
            this.state = deepFreeze(mergeModule(this.state, newPartialState))
          }
        }
      } finally {
        // the `isDispatching` need restore.
         this.isDispatching = false
        // restore state
        restoreProcessState()
      }

      // update components
      updateComponents(this, callback)
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

  // get module
  getModule (namespace, remainMsg) {
    assert(
      typeof namespace === 'string',
      'the namespace mast be a string',
    )

    if (!namespace) {
      return this.state
    }

    // deal with module state
    const module = getModule(this.state, namespace)
    // if the module does not meet the requirements
    // throw error
    if (remainMsg && module === null) {
      warning(`The [${namespace}] module is not exist.${remainMsg || ''}`)
    }
    return module
  }

  addModule (namespace, reducers) {
    assert(
      typeof namespace === 'string',
      'the namespace mast be a string',
    )

    if (!isEmptyObject(reducers)) {
      let i = 0
      const keys = Object.keys(reducers)
      const symbols = Object.getOwnPropertySymbols(reducers)

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

  // insert method
  rewirteConfigAndAddDep (config, isPage) {
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

      assert(
        isPlainObject(defineObject),
        '[useState] must return a plain object, ' +
          `but now is return a [${typeof defineObject}]`,
      )
      
      // need deep clone, otherwise the `data.global` on the back of the component cannot be changed.
      createState = () => clone(mapObject(defineObject, fn => {
        if (namespace === null) {
          return fn(store.state)
        }
        const module = this.getModule(namespace, `\n\n   --- from [${namespace}] of useState.`)
        return fn(module, store.state)
      }))
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