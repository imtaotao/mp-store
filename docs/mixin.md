## 这是关于 mixin 相关的使用介绍
由于小程序没有一个很好的 mixin 扩展机制，所以 `mp-store` 额外提供了这样一个功能，当时由于 `mixin` 的扩展机制并不是很好，这里只作为一个可选性，谨慎使用。如果组件内部有和混入的方法有相同的 key 时，以组件的为主

### Usage
```js
  // 需要注意的是，你不能注册重复的方法
  const store = createStore(rigister => {
    rigister('log', msg => {
      console.log(msg)
    })

    rigister('warn', msg => {
      console.log('taotao')
    })
  })

  // 以下 demo 在 component 中也是一样的行为
  // page one
  Page({
    onLoad () {
      this.log('tao') // tao 
      this.warn() // imtaotao
    },

    warn () {
      console.log('imtaotao')
    }
  })

  // page two
  Page({
    onLoad () {
      this.log('tao') // tao 
      this.warn() // taotao
    },
  })
```