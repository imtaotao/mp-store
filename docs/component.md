## 这是关于 page 和 component 相关的使用介绍
微信小程序中，page 和 component 都是传递一个 object 作为实例的配置，最后来生成相应的实例，这套配置信息，不是组件，也与最终的组件信息不是一一匹配的，所以我们可以对他进行增改。基于这个原因，`mpstore` 对这套配置信息增加了新的配置项 `storeConfig`，用来存放于 store 相关和需要用到的信息

下面一个简易的 demo，简单认识一下
```js
Component({
  storeConfig: {

  },
  // ...
})

Page({
  storeConfig: {

  },
  // ...
})
```

下面是所有的配置项，所有配置，函数的上下文都是 stoer，而不是当前所在的组件，需要注意
+ `willUpdate`
+ `didUpdate`
+ `defineReducer`
+ `usedGlobalState`

### willUpdate(component: Cm, newPartialState: Object) ?: false
与全局钩子的 `willUpdate` 一样，返回 `false` 将会阻止当前组件更新，不同的是，这个钩子只对当前组件起作用，而且性能更好，因为会在 `data diff` 之前调用，而全局的 `willUpdata` 钩子会在 `data diff` 之后调用
```js
Page({
  storeConfig: {
    willUpdate (component, newPartialState) {
      if (component.data.global.xx === newPartialState.xx) {
        return false
      }
    }
  }
})
```

### didUpdate(component: Cm, newPartialState: Object, patchs: Array<patch>) : void
`didUpdate` 也是一样的，与全局的 `didUpdate` 钩子一样，不同的是，这个钩子只对当前组件起作用，而且接受的参数不一样，组件内的 `didUpdate` 会接受 `patchs` 参数，会在全局的 `didUpdate` 钩子之前调用
```js
import createStore, { restore } from '@rustle/mp-store'
const store = createStore()

Page({
  storeConfig: {
    didUpdate (component, newPartialState, patchs) {
      if (component.data.global.xx === newPartialState.xx) {
        // restore 方法可以根据 patchs 把 object 恢复到原来的结构，但是是引用关系
        component.setData({ global: restore(component.data.global, patchs) })
      }
    },
  },
})
```

`patch` 有什么用？由于 store 的 state 不可变，这就天然的给我们带来可以回到任一一个状态的机会，而且 `patch` 是新旧两组数据之间的差异集合，这就意味着我们可以根据这组差异来恢复状态，例如以下 demo，用来做“时光旅行”。**后续我们会把时光旅行的功能作为内置的 API 加入进来**
```js
import { restore } from '@rustle/mp-store'
const array = []

Page({
  storeConfig: {
    // 每次更新完毕后把 patchs 收集起来
    didUpdate (component, newPartialState, patchs) {
      array.push(patchs)
    },
  },

  other () {
    // 回到上个时刻的状态
    // 你只能对相邻的两组数据来 restore，意思是新旧两组数据 diff 产生的 patch，你也只能根据这两组数据复原
    this.setData({ global: restore(this.data.global, array[array.length - 1], 'global') })
  },
})
```

### defineReducer(store: Store) : void
`defineReducer` 这个钩子会在小程序启动的时候就调用，他不是在组件实例化的时候调用的，这个方法出现的原因是为了方便定义 `reducer`，`reducer` 定义的状态应该是与一些组件强相关的，但是微信小程序定义组件，文件已经太多，为了避免再加一个配置文件，减少负担，所以加了这个钩子
```js
Page({
  storeConfig: {
    defineReducer (store) {
      store.add('action', {
        partialState: {
          name: 'tao',
        },
      })
    },
  },
})
```

### usedGlobalState(store: Store) : Object
`usedGlobalState` 是最为重要的一个钩子，他定义了当前组件需要使用的全局状态，如果 `usedGlobalState` 钩子未被定义，当前组件将不会被依赖，也不会注入 `glabal`，你将不会有 `this.data.global`。`usedGlobalState` 必须返回一个 `object`，这个 `object` 定义着当前组件需要使用的数据，他会被缓存这，用来参与 `data diff` 的过程。这意味着，每次组件更新时，都会用到这个 `object` 来生成全新的数据 
```js
store.add('action', {
  partialState: {
    a: 1,
    b: 2,
  },
  setter (state, payload) {
    return { a: payload }
  },
})

Page({
  storeConfig: {
    usedGlobalState (store) {
      // key 就是会被注入到 global 中的关键字
      // value 为一个 function，返回的值会被放入到 global 中
      return {
        a: state => state.a,
        b: state => state.b,
      }
    },
  },
})

// page.data.global => { a: 1, b: 2 }

// dispatch 时将会调用 setter 函数，从而更新 store.state，
// 然后调用 usedGlobalState 中第一的函数，得到组件所用的全新的数据
// 对新旧两组数据进行 diff，然后才会更新组件
store.dispatch('action', 2)

// page.data.global => { a: 2, b: 2 }
```