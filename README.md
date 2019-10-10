## mp-store
[![NPM version][npm-image]][npm-url]
<a href="https://shang.qq.com/wpa/qunwpa?idkey=fcb17d938fab0e30e879dd96421d91e24805e0bc1077022ff5ae562b732a2508">
  <img src="https://img.shields.io/badge/QQ群-624921236-ff69b4.svg?maxAge=2592000&style=flat-square">
</a>
<a href="https://codecov.io/github/imtaotao/mp-store?branch=master">
  <img src="https://img.shields.io/codecov/c/github/imtaotao/mp-store/master.svg">
</a>


一个轻量级的微信小程序状态管理库，他将能够平滑的兼容以前的旧项目，并不会有很强的侵入性，所以你可以直接迁移过来。如果你的小程序没有引入 `npm` 包的功能，可以在[这里](https://cdn.jsdelivr.net/gh/imtaotao/mp-store/dist/mpstore.esm.js)下载，然后放到项目中去.


需要注意的是，打包后的源码包含部分的 `es6` 的代码，例如 `正则后行断言`、`Map` 数据结构，如果你希望这些代码不影响你的项目，你可能不能使用  `restore` 这个方法

## [store 的介绍](https://github.com/imtaotao/mp-store/blob/master/docs/store.md)
## [storeConfig 的介绍](https://github.com/imtaotao/mp-store/blob/master/docs/component.md)
## [middleware 的介绍](https://github.com/imtaotao/mp-store/blob/master/docs/middleware.md)
## [mixin 的介绍](https://github.com/imtaotao/mp-store/blob/master/docs/mixin.md)
## [hooks 的介绍](https://github.com/imtaotao/mp-store/blob/master/docs/hooks.md)
## [data diff 的原理](https://github.com/imtaotao/mp-store/blob/master/docs/diff.md)

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

[npm-image]: https://img.shields.io/npm/v/@rustle/mp-store.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@rustle/mp-store