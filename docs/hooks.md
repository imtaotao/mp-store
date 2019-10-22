## 这是关于 hooks 相关的使用介绍
在创建一个 store 的时候，我们可以添加一些全局的 hooks，用来拦截一些常见的 store 内部行为，这让我们有机会对内部的一些行为进行操作，这是为了更好的扩展性而设计的。以后增加新功能时可能会增加新的钩子

### 如何创建
```js
  // 总共有四种钩子
  const store = createStore(null, {
    createBefore (config, isPage) {
      // ...
    },

    addDep (component, isPage) {
      // ...
    },

    willUpdate (component, newPartialState, patchs, isPage) {
      // ...
    },

    didUpdate (component, newPartialState, isPage) {
      // ...
    },
  })
```

### createBefore(config: Object, isPage: boolean) : void
在调用原生的 `Page` 和 `Component` 方法之前会触发此钩子，你可以在这里对 `config` 进行更改，做一些其他自定义的功能
```js
  const store = createStore(null, {
    createBefore (config, isPage) {
      // 例如，你可以对所有的组件实例添加一个 icons，这样所有模板都能直接引用 icon
      config.data.icons = {
        happy: 'https://xx.xx.jpg',
      }
    },
  })
```
然后就可以在模板中使用
```html
  <image src='{{ icons.happy }}' />
```

### addDep(component: Cm, isPage: boolean) ?: false
每个组件实例在被添加到依赖的时候，会触发此钩子，`return false` 将会阻止添加进依赖，这会导致当前组件不会随着全局状态的更新而更新，假如你的组件只在初始化的时候需要全局状态，以后都不会再需要，你可能需要这个钩子
```js
  const store = createStore(null, {
    addDep (component, isPage) {
      if (typeof component.noAddToDep === 'function') {
        return false
      }
    },
  })

  store.add('action', {
    partialState: {
      name: 'tao',
    },
    setter: (state, payload) => ({ name: payload }) 
  })

  Page({
    storeConfig: {
      useState: () => ({
        name: state => state.name,
      }),
    },
    noAddToDep () {},
  })

  page.data.global.name // tao
  store.dispatch('action', 'taotao')
  // page 中的 global 将不会改变，因为被 addDep 钩子给拦截掉，没有被添加到依赖中
  page.data.global.name // tao
```

### willUpdate(component: Cm, newPartialState: Object, patchs: Array<patch>, isPage: boolean) ?: false
`willUpdate` 钩子会在每个组件将要更新的时候触发，`return false` 将会阻止更新
```js
  const store = createStore(null, {
    // newPartialState 为此次更新的状态，就是 dispatch 调用时，setter 函数返回的数据
    willUpdate (component, newPartialState, patchs, isPage) {
      if (component.data.global.xx === newPartialState.xx) {
        return false
      }
    },
  })
```

### didUpdate(component: Cm, newPartialState: Object, isPage: boolean) : void
`didUpdate` 钩子会在每个组件更新完成后触发，可以做一些其他的操作
```js
  const store = createStore(null, {
    didUpdate (component, newPartialState, isPage) {
      // ...
    },
  })
```