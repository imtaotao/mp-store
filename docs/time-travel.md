## 这是关于 time travel 相关的使用介绍

mpstore 可以保存每次 `dispatch` 后的 `patchs`，这样就可以根据这些 `patchs` 信息来恢复状态， mpstore 会为每个组件都创建这个历史记录的堆栈。每个组件都会被注入一个 `timeTravel` 对象，用来操作这些 `patchs`，所以你可以在组件和 page 中通过 `this.timeTravel` 拿到 `timeTravel` 对象。以下是 api 介绍和 demo

## 如何启动 time travel
+ 必须指定一个堆栈记录数 `travelLimit`，默认为 0，也就是不做记录
+ 必须使用到 `global.state`，因为 `timeTravel` 只对全局状态的更改才有效，组件内部的 data 更改，timeTravel 不会做任何记录
+ 如果没有通过 `storeConfig.useState` 指定全局状态，调用 timeTravel 的 api 将会报错

## 属性
### length
`timeTravel.length` 记录着当前堆栈保存的 `patchs` 的个数

### current
`timeTravel.current` 指向当前状态所在的 index，每次 `dispatch` 时都会重新指向最末端

## API
### go(n: number) : void
go 方法将让当前的下标往前或者往后移动 n 个位置
```js
  Page({
    storeConfig: {
      travelLimit: 5,
      defineReducer (store) {
        store.add('action', {
          partialState: {
            a: 1,
          },
          setter (state, payload) {
            return { a: payload }
          },
        })
      },
      useState: () => ({
        a: state => state.a,
      })
    },

    onload () {
      console.log(this.data.global.a) // 1
      this.store.dispatch('action', 2)
      console.log(this.data.global.a) // 2

      // 回退到上一个状态
      this.timeTravel.go(-1)
      console.log(this.data.global.a) // 2
    },
  })
```

### forward() : void
`forward` 是 `go(1)` 的简写，调用 `forward` 与调用 `go(1)` 的效果是一样的

### back() : void
`forward` 是 `go(-1)` 的简写，调用 `forward` 与调用 `go(-1)` 的效果是一样的

### toStart() : void
`toStart` 将会直接回退到最开始的状态，也就是只想 history 堆栈的第一个 patchs 记录的状态<br>
源码如下
```js
  toStart () {
    this.go(-this.current)
  }
```

### toEnd() : void
`toStart` 将会直接回退到最末端的状态，也就是只想 history 堆栈的最后一个 patchs 记录的状态<br>
源码如下
```js
  toEnd () {
    this.go(this.history.length - this.current)
  }
```

### Tips
+ 没个组件的 `timeTravel` 将会是独立的，不会互相影响
+ 当有新的 `dispatch` 导致当前组件用到的全局状态有更改时，`current` 会重新指向最末端
+ 如果当前当前 `current` 属性已经是 `history` 堆栈的最末端或者最开端，调用 `timeTravel` api 将不会起作用，因为已经没法往前后往后了，并且你将会得到一条警告信息
```js
  Page({
    storeConfig: {
      travelLimit: 5,
      useState: () => ({
        a: state => state.a,
      })
    },

    onload () {
      // 回退到上一个状态
      // 但这并不会有任何作用，并且将会产生一条 warning，因为此时的 history 堆栈记录的 patchs 为 0 个
      this.timeTravel.go(-1)
    },
  })
```