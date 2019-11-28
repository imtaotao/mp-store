## mp-store
[![Build status](https://travis-ci.org/imtaotao/mp-store.svg?branch=master)](https://travis-ci.org/imtaotao/mp-store)
[![Coverage](https://img.shields.io/codecov/c/github/imtaotao/mp-store/master.svg)](https://codecov.io/github/imtaotao/mp-store?branch=master)
[![NPM version](https://img.shields.io/npm/v/@rustle/mp-store.svg?style=flat-square)](https://www.npmjs.com/package/@rustle/mp-store)
[![QQ group](https://img.shields.io/badge/QQ群-624921236-ff69b4.svg?maxAge=2592000&style=flat-square)](https://shang.qq.com/wpa/qunwpa?idkey=fcb17d938fab0e30e879dd96421d91e24805e0bc1077022ff5ae562b732a2508)

```
npm install @rustle/mp-store
```
一个轻量级的微信小程序状态管理库，他将能够平滑的兼容以前的旧项目，并不会有很强的侵入性，所以你可以直接迁移过来。如果你的小程序没有引入 `npm` 包的功能，可以在[这里](https://cdn.jsdelivr.net/gh/imtaotao/mp-store/dist/mpstore.esm.js)下载，然后放到项目中去。

## Usage
这是一个简单的的迁移 demo
```js
// 只需要两行代码，你就可以使用 mp-store 了
// 如果不想使用，也不会对你原有的项目产生影响
import createStore from '@rustle/mp-store'
const store = createStore()

App({
  // ...
})
```

下面是一个完整的使用 demo，更具体的使用，可以看相关部分的具体介绍
1. 创建 `reducer`
```js
store.add('action', {
  partialState: {
    name: 'tao',
  },
  setter (state, payload) {
    return { name: payload }
  }
})
```

2. 在 `Page` 和 `Component` 中使用
```js
// mp-store 对 page 和 component 无差别对待
Page({
  storeConfig: {
    useState: (store) => ({
      name: state => state.name 
    })
  },

  onLoad () {
    this.data.global.name // tao
  },

  // 更改
  change () {
    this.store.dispatch('action', 'chentao')
    this.data.global.name // chentao
  },
})
```

如果你使用了模块，则会稍微有一点不同，看下面的 demo
1. 创建 `reducer`
```js
// 定义全局的 state
store.add('global', {
  partialState: {
    age: 25,
  },
})

// 模块
const action = 'action'
const reducer =  {
  partialState: {
    name: 'tao',
  },
  setter (state, payload) {
    return { name: payload }
  },
}

store.addMoudle('user', {
  [action]: reducer,
})
```

2. 在 `Page` 和 `Component` 中使用
```js
// useState 是一个数组，第一个参数为需要注入的 module
Page({
  storeConfig: {
    useState: ['user', (store) => ({
      name: module => module.name,
      age: (module, rootState) => rootState.age
    })]
  },

  onLoad () {
    this.data.global.age // 25
    this.data.global.name // tao
  },

  // 更改
  change () {
    this.store.dispatch('action', 'chentao')
    this.data.global.name // chentao
  },
})
```

## [store 的介绍](https://github.com/imtaotao/mp-store/blob/master/docs/store.md)
## [storeConfig 的介绍](https://github.com/imtaotao/mp-store/blob/master/docs/component.md)
## [module 的介绍](https://github.com/imtaotao/mp-store/blob/master/docs/module.md)
## [middleware 的介绍](https://github.com/imtaotao/mp-store/blob/master/docs/middleware.md)
## [time travel 的介绍](https://github.com/imtaotao/mp-store/blob/master/docs/time-travel.md)
## [mixin 的介绍](https://github.com/imtaotao/mp-store/blob/master/docs/mixin.md)
## [hooks 的介绍](https://github.com/imtaotao/mp-store/blob/master/docs/hooks.md)
## [data diff 的原理](https://github.com/imtaotao/mp-store/blob/master/docs/diff.md)