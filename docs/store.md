## 这是关于 store 相关的使用介绍

### createStore(mixin?: Function, hooks?: Object) : Store
store 是通过 `mp-store` 导出的 `createStore` 这个方法来创建的，这个方法接受两个参数。第一个参数为 [`mixin`](./mixin.md) 的注入函数，第二个参数为 [`hooks`](./hooks.md)。
```js
import createStore from '@ruslte/mp-store'
const store = createStore(() => {}, {})
```

store 会把原生的 `Page`、`Component` 函数包装一层，来做一层拦截，这样 store 就可以收集到所有使用到全局状态的组件，也就是收集依赖。这也就是为什么 store 对原有的功能不影响的原因，下面是 store 的一些介绍。

+ 每个 store 拥有唯一的 id，可以通过 `store.id` 拿到。
+ store 的 `state` 是不可变的，所以你不能这样操作 `this.store.state.xx = 1`。
+ store 会把用到的全局状态放到所用到的 data 中去，默认的命名空间是 `global`，所以你可以这样在组件中拿到当前所用到的全局状态 `this.data.global`，如果与原有的项目有冲突，你可以在 `App` 初始化之前调用 `setNamespace` 方法更改为其他的名字。
+ store 会在 `onLoad` 和 `attached` 被调用之前被注入进实例中，依赖的收集也是在这个时间进行的。
+ store 会在 `onUnload` 和 `detached` 被调用之后被移除，依赖的移除也是在这个时间进行，如果你的组件被销毁后，仍然强行引用着（也就是说如果你有内存泄漏的情况，常见的副作用导致的有网络请求，定时器等），你将无法获取到 store，也无法对这个组件进行全局状态的更新，因为都已经被移除和删掉了。
+ store 会被注入到 `page` 和 `component` 示例中，所以你可以通过以下方式来拿到 store。
```js
  const store = this.store
```

### API
#### add(action: string, reducer: Object) : void
`add` 方法用于添加一个 `reducer`, `action` 是唯一的，如果有重复，将会报错，`reducer` 的类型如下。
```ts
  interface Reducere {
    partialState: Object
    setter?: (state: Store['state'], payload: any) : Object
  }
```
`partialState` 定义的状态将被合并到全局状态，如果里面包含着全局状态已有的字段，是不被允许的，`setter` 函数可以用来返回一个对象，这个对象将被合并到全局状态中。

```js
  store.add('action', {
    partialState: {
      name: 'tao',
    },
    setter (state, payload) {
      return { name: payload }
    },
  })

  console.log(store.state.name) // 'tao'

  store.dispatch('action', 'imtaotao')

  console.log(store.state.name) // 'imtaotao'
```

#### dispatch(action: string, payload: any, callback?: () => void) : void
`dispatch` 方法用于触发一个 `action`，他会调用所有的中间件，最后在调用 `reducer` 的 `setter` 函数，你将不能在 `setter` 函数中调用 `dispatch` 方法，以下的写法将会报错。这样做的愿意是为了避免逻辑过于混乱，但你可以在中间件中调用 `dispatch`。
```js
  store.add('action', {
    partialState: {
      name: 'tao',
    },
    setter (state, payload) {
      store.dispatch('xx') // 这一句将会报错
      return { name: payload }
    },
  })

  store.dispatch('action', 'imtaotao')
```

`callback` 方法会在 `store.state` 改变后，所有依赖的组件更新后调用，因为**中间件中可能会处理异步行为**，所以这个 `callback` 的存在是必要的。
```js
  store.add('action', {
    partialState: {
      name: 'tao',
    },
    setter (state, payload) {
      return { name: payload }
    },
  })

  store.use((payload, next) => {
    setTimeout(next(payload))
  })

  console.log(store.state.name) // 'tao'

  store.dispatch('action', 'imtaotao', () => {
    console.log(store.state.name) // 'imtaotao'
  })

  console.log(store.state.name) // 'tao'
```

#### setNamespace(namespace: string) : void
store 默认会在组件的 data 中添加 `global` 来接受用到的全局状态，如果需要更改，可以通过此方法。需要注意的是你必须在 `App` 初始化之前调用。
```js
  store.setNamespace('xxx')

  App({
    // ...
  })
``` 

#### use(action: string | Function, layer?: Function) : Function
`use` 方法用来添加中间件，中间件的详细文档在[这里](./middleware.md)可以看到。如果只传了一个参数，则默认拦截所有的 `action`。
```js
// 将会拦截 `changed` 这个 action
// 中间件的添加顺序为执行顺序，所以你必须调用 next，否则，后面添加的中间件将不会执行
store.use('changed', (payload, next) => {
  payload++
  next(payload)
})
```

下面这种语法将会拦截所有的 `action`。
```js
store.use((payload, next, action) => {
  if (action === 'changed') {
    payload++
    next(payload)
  }
})
```