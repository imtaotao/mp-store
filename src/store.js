import {
  clone,
  assert,
  remove,
  warning,
  callHook,
  parsePath,
  mapObject,
  mergeState,
  createWraper,
  isPlainObject,
  isEmptyObject,
  inspectStateNamespace,
} from './utils'
import { diff } from './diff'
import TimeTravel from './time-travel'
import { Middleware, COMMONACTION } from './middleware'
import { applyPatchs, updateComponents } from './update'
import { moduleFlag, isModule, getModule, createModuleByNamespace, createModule } from './module'

// Each `store` instance has a unique id
let storeId = 0

function filterReducer (state, action, reducer) {
  const { setter, namespace, partialState } = reducer

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

  const haveNamespace = 'namespace' in reducer
  // if `partialState` have `__mpModule` word, in fact, the `partialState` is module
  if (haveNamespace || isModule(partialState)) {
    assert(
      haveNamespace && typeof namespace === 'string',
      'The module namespace must be a string.' +
        `\n\n --- from [${action}] action.`,
    )

    // obtaining module according namespace
    const module = getModule(state, namespace)
    // if the namespace is already in global state
    if (namespace in state) {
      if (!(isPlainObject(module) && module[moduleFlag])) {
        warning(
          `The module [${namespace}] in the global state, you can't defined [${namespace}] module` +
            `\n\n --- from [${action}] action.`
        )
      }
    }
    
    // create module
    if (module) {
      inspectStateNamespace(partialState, module, key => {
        return `The [${key}] already exists in [${namespace}] module, ` +
          `Please don't repeat defined. \n\n --- from [${action}] action.`
      })

      reducer.partialState = {
        [namespace]: Object.assign(
          {},
          module,
          partialState,
        )
      }
    } else {
      reducer.partialState = {
        [namespace]: Object.assign(
          partialState,
          {
            [moduleFlag]: true,
          },
        ),
      }
    }
  } else {
    // inspect all state key 
    inspectStateNamespace(partialState, state, key => {
      return `The [${key}] already exists in global state, ` +
        `Please don't repeat defined. \n\n --- from [${action}] action.`
    })
  }

  if (typeof setter !== 'function') {
    reducer.setter = () => {
      warning(
        `Can\'t changed [${action}] action value. Have you defined a setter?` +
          `\n\n --- from [${action}] action.`
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
    assert(
      !this.reducers.find(v => v.action === action),
      `Can't repeat defined [${action}] action.`,
    )

    const { partialState } = filterReducer(this.state, action, reducer)

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
    this.middleware.process(action, payload, (destPayload, restoreProcessState) => {
      this.isDispatching = true

      try {
        let newPartialState
        const namespace = reducer.namespace
        const isModuleDispatch = typeof namespace === 'string'

        if (isModuleDispatch) {
          const module = this.getModule(namespace, true)
          // generate new partial state
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
          if (isModuleDispatch) {
            this.state = mergeState(
              this.state,
              {
                [namespace]: Object.assign(
                  {},
                  this.getModule(namespace),
                  newPartialState,
                ),
              },
            )
          } else {
            this.state = mergeState(
              this.state,
              newPartialState,
            )
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
  getModule (namespace, needInspect) {
    assert(
      typeof namespace === 'string',
      'the namespace mast be a string',
    )

    // deal with module state
    const module = parsePath(namespace)(this.state)
    // if the module does not meet the requirements
    // throw error
    if (needInspect && !(isPlainObject(module) && module.__mpModule)) {
      warning(`The [${namespace}] module is not exist.`)
    }
    
    return module
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
        return namespace === null
          ? fn(store.state)
          : fn(this.getModule(namespace, true), store.state)
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