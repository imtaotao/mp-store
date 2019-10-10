## 这是关于 middleware 相关的使用介绍
store 的设计是一个纯逻辑层，他不会处理异步相关的逻辑，这是中间件出现的最重要的一个原因，在中间件中可以处理异步请求等相关的任务，当然，也可以做其他的事情。你可以通过 `store.use` 来添加中间件，`use` 方法的使用细节可以看[这里](./store.md#useaction-string--function-layer-function--function)

### 理念
+ `中间件被设计成一个调用队列，中间件添加的顺序与调用顺序是一致的`
+ `在中间件中是可以调用 store.dispatch 方法的，但是不能在中间件中添加新的中间件，否则将会报错`
+ `中间件可以拦截单一的 action，也可以拦截所有的 action`

下面是模拟一个常见的业务场景，用于帮助理解如何在中间件中处理异步行为
  
保存一个用户信息
```js
store.use('SAVEUSERINFOR', (payload, next) => {
  // 模拟发送异步请求，接口返回最新的用户信息数据
  ajax.post(payload).then(res => {
    next(res.data)
  })
})
```

在组件中
```js
Page({
  storeConfig: {
    // 定义了关于用户信息的数据
    defineReducer (store) {
      store.add('SAVEUSERINFOR', {
        partialState: {
          age: 25,
          userId: 0,
          name: 'tao',
        },
        setter: (state, payload) => payload,
      })
    },
  },

  // 假定用户点击后发起请求
  click () {
    this.store.dispatch('SAVEUSERINFOR', 'xxx')
  },
})
```

在另一个 component 中
```js
Component({
  storeConfig: {
    usedGlobalState (stor) {
      return {
        useInfo: state => ({
          age: state.age,
          name: state.name,
          userId: state.userId,
        }),
      }
    },
  },
})
```

上面模拟的业务场景中，发生了以下几步操作：
1. 用户点击保存信息，调用 page 的 `click` 方法，发起了一个 `dispatch`
2. 中间件拦截到了这个 `action`, 并发起了网络请求
3. 请求成功后，中间件调用 `next` 方法，继续执行剩下的中间件逻辑，直到 `setter` 函数被调用，更新相关组件