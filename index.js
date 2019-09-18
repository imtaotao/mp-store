// 对一些参数做断言
function assertreducer (state, action, reducer) {
  if (!('partialState' in reducer)) {
    throw new Error(
      `You must defined "partialState" of "${action}".\n\n`
    )
  }

  if (!reducer.partialState || typeof reducer.partialState !== 'object') {
    throw new Error(
      `The partialState of "${action}" must be an object.\n\n`
    )
  }

  for (const key in reducer.partialState) {
    if (state.hasOwnProperty(key)) {
      throw new Error(
        `The "${key}" already exists in global state,` +
          'Please don\'t repeat defined.'
      )
    }
  }

  if (!reducer.setter) {
    reducer.setter = () => {
      throw new Error(
        `Can\'t set "${action}" value. ` +
          'Have you defined a setter?\n\n'
      )
    }
  }

  return reducer
}

function valueEqual (a, b) {
  if (a === b) return true
  if (a == null || b == null) return false

  // 如果是数组
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false
    return a.every((item, i) => valueEqual(item, b[i]))
  }

  // 如果是对象
  if (typeof a === 'object' || typeof b === 'object') {
    const aVal = a.valueOf ? a.valueOf() : Object.prototype.valueOf.call(a)
    const bVal = b.valueOf ? b.valueOf() : Object.prototype.valueOf.call(b)

    if (aVal !== a || bVal !== b) {
      return valueEqual(aVal, bVal)
    }

    // 对每个 item 进行比对
    const keys = Object.keys(Object.assign({}, a, b))
    return keys.every(key => valueEqual(a[key], b[key]))
  }

  return false
}


function updateComponent (cm, partialState) {
  
}

function createStore (initState) {
  let isDispatching = false
  const container = {
    state: {},
    setters: {},
    actions: [],
    pagesAndComponents: [],
  }

  const store = {
    // 获取 page 或者 component 实例
    // require actions 为一个优化项，如果没有，默认不会被更新
    // 如果指定了，则会如果当前 dispatch 的 action 不包含在里面，则不会更新
    rigisterComponent (config, isPage) {
      const store = this
      const requireActions = config.requireActions || []

      config.data = config.data || {}
      config.data.global = container.state

      if ('requireActions' in config) {
        delete config.requireActions
      }

      // 方便允许在 page 或者 component 内部初始化
      if (typeof config.createReducer === 'function') {
        const context = { store }
        config.createReducer.call(context, store)
        delete config.createReducer
      }

      const remove = cm => {
        const index = container.pagesAndComponents.indexOf(cm)
        if (~index) {
          container.pagesAndComponents.splice(index, 1)
        }
      }

      // page
      if (isPage) {
        const onLoad = config.onLoad
        const onUnload = config.onUnload

        config.onLoad = function (opts) {
          // 将 store 注入到实例中去，以便使用
          this.store = store
          // 如果发现有数据变化，创建时就需要更新
          if (!valueEqual(this.data.global, container.state)) {
            this.setData({ global: container.state })
          }
          onLoad && onLoad.call(this, opts)
          container.pagesAndComponents.push({ cm: this, requireActions })
        }

        config.onUnload = function () {
          onUnload && onUnload.call(this)
          this.store = null
          remove(this)
        }
      } else {
        // component
        config.lifetimes = config.lifetimes || {}
        const created = config.created || config.lifetimes.created
        const attached = config.attached || config.lifetimes.attached
        const detached = config.detached || config.lifetimes.detached

        config.created = config.lifetimes.created = function () {
          this.store = store
          created && created.call(this)
          container.pagesAndComponents.push({ cm: this, requireActions })
        }

        config.attached = config.lifetimes.attached = function () {
          // 如果发现有数据变化，创建时就需要更新
          if (!valueEqual(this.data.global, container.state)) {
            this.setData({ global: container.state })
          }
          attached && attached.call(this)
        }
  
        config.detached = config.lifetimes.detached = function () {
          detached && detached.call(this)
          this.store = null
          remove(this)
        }
      }
    },

    // 添加单个 reducer
    add (action, reducer) {
      if (container.actions.includes(action)) {
        throw new Error(
          `The "${action}" is already exists.\n\n`
        )
      }

      reducer = assertreducer(container.state, action, reducer)
      container.actions.push(action)

      Object.assign(container.state, reducer.partialState)

      // wrop setter
      container.setters[action] = payload => {
        // 我们只给当前 reducer 的 partialState 进行更改
        reducer.setter(reducer.partialState, payload)
        return reducer.partialState
      }
    },

    dispatch (action, payload) {
      if (isDispatching) {
        throw new Error(
          'It is not allowed to call "dispatch" during dispatch execution.'
            + `\n\n   --- from [${action}] action\n\n`
        )
      }

      if (!container.actions.includes(action)) {
        throw new Error(
          `"${action}" does not exist. ` +
            'Maybe you have not defined.\n\n'
        )
      }

      // 我们不允许在 dispatch 的时候再 dispatch
      // 这意味着不能在 setter 函数中调用 dispatch
      isDispatching = true

      let newPartialState

      try {
        newPartialState = container.setters[action](payload)
        Object.assign(container.state, newPartialState)
      } catch (err) {
        isDispatching = false
        throw new Error(`${err}\n\n   --- from [${action}] action\n\n`)
      }

      // 更新组件
      container.pagesAndComponents.forEach(({cm, requireActions}) => {
        if (requireActions === 'all' || requireActions.includes(action)) {
          // 允许优化
          if (typeof cm.updateGlobalState === 'function') {
            if (cm.updateGlobalState(container.state) !== false) {
              updateComponent(cm, newPartialState)
            }
          } else {
            updateComponent(cm, newPartialState)
          }
        }
      })
      isDispatching = false
    },

    // 允许增加一个对象到 globalState，并把 key 作为 actions
    addMultipleReducers (reducers) {
      if (!reducers || typeof reducers !== 'object') {
        throw new Error('The "reducers" must be an object.\n\n')
      }

      const currentActions = []
      for (key in reducers) {
        this.add(key, reducers[key])
        currentActions.push(key)
      }
      return currentActions
    },

    // container.state 只允许内部更改
    getState () {
      return Object.assign({}, container.state)
    },
  }

  // 添加初始 state
  if (initState) {
    store.addMultipleStates(initState)
  }

  return store
}


export const nativePage = Page
export const nativeComponent = Component

export default function (initState, mixinMethods, createHook) {
  // 扩展对象
  const extendMethods = {}
  const store = createStore(initState)

  // 混入一些全局方法
  if (typeof mixinMethods === 'function') {
    mixinMethods((name, fn) => {
      if (extendMethods.name) {
        throw new Error(`The "${name}" is exist.`)
      }
      extendMethods[name] = fn
    })
  }

  function extendData (config, isPage) {
    // 注册全局 state
    store.rigisterComponent(config, isPage)
  
    // 扩展方法
    if (isPage) {
      Object.assign(config, extendMethods)
    } else {
      config.methods = config.methods || {}
      Object.assign(config.methods, extendMethods)
    }
  }

  // 添加需要扩展属性
  Page = function (config, ...args) {
    extendData(config, true)
    // 允许外部再次进行更改
    if (typeof createHook === 'function') {
      createHook(config)
    }
    nativePage.call(this, config, ...args)
  }

  Component = function (config, ...args) {
    extendData(config, false)
    if (typeof createHook === 'function') {
      createHook(config)
    }
    nativeComponent.call(this, config, ...args)
  }

  return store
}