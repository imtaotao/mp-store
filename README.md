## mp-store
[![NPM version][npm-image]][npm-url]

[npm-image]: https://img.shields.io/npm/v/@rustle/mp-store.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@rustle/mp-store

一个轻量级的小程序状态管理库。

## API
一个全局的状态管理 store，有三个对外暴露的 API
  + `add(action: string, reducer: Object)`
  + `dispatch(action: string, payload: any)`
  + `addMultipleStates(reducers: Object)`

初始化后 store 将会注入到 page 或者 component 实例中，所以你可以通过 `this.store` 获取到 store 的实例。另外在 page 和 component 中额外增加了三个配置。

### `createReducer: (store: Store) => void`
这个钩子函数会在 page 和 component 创建之前调用，然后销毁，所以你可以在这里定义一些 reducer。

### `updateGlobalState: (newState: any) => boolean`
这个钩子函数可以优化你的 page 或者 component 渲染。如果返回 false 将阻止当前组件渲染。

### `requireActions: Array<action> | 'all'`
这个是一个优化配置项，如果没有指定，则每当有 dispath 的时候，当前 page 或 component 都不会更新，
如果指定了，则只有当前指定的 action 被触发时才会更新，如果指定的是 `all`，则任何 dispath 都会更新。

## 初始化
得在整个应用初始化之前初始化 store
```js
import createStore from '@rustle/mp-store'

// 第二个参数可以混入一些方法，就像 vue 那样，但这个不是一个好的扩展机制，谨慎使用
export default createStore({}, mixin => {
  mixin('warn', (msg, duration = 1500) => {
    wx.showToast({
      duration,
      title: msg,
      icon: 'none',
    })
  })
})

// 然后你就可以在里面在 page 或者 component 里面使用
Component({
  created () {
    this.warn('这是一条警告')
  }
})

```

## demo
```js
  // parent page
  Page({
    createReducer (store) {
      store.add('ACTION', {
        partialState: {
          name: 'chentao',
        },

        setter (state, payload) {
          state.name = payload
        },
      })
    },
  })

  // child page or component
  Page({
    requireActions: ['ACTION'],

    updateGlobalState (newState) {
      // 这将阻止当前 page 更新
      if (this.data.global.xx === newState.xx) {
        return false
      }
    },

    created () {
      setTimeout(() => {
        this.store.dispath('ACTION', 'imtaotao')
      }, 3000)
    },
  })
```

在模板中使用全局状态数据
```html
  <!-- child page wxml -->
  <view>
    {{ global.name }}
  </view>
```