## 这是关于 module 相关的使用介绍
mpstore 可以创建模块，来对 state 进行模块化分割。模块是独立的也是关联在一起的，这是什么意思？整个 state 是一个巨大的 object。假如有以下数据结构。

```js
{
  a: {
    c: {

    },
  },
  b: {
    d: {

    },
  },
  f: {

  },
}
```
对于这个结构，如果我们要做模块化区分，我们可以这样认为
1. 整个 `global state` 我们可以看作一个唯一的全局的模块
2. `state.a` 可以看成一个模块
3. `state.a.c` 也可以看作为一个模块
4. `state.b` 可以看成一个模块
5. `state.b.d` 也可以看作为一个模块
6. `state.f` 不看作为一个模块，看作为一个普通的 object

这样做，会让每一个个 object 成为一个模块，每个 object 是独立，但是模块与普通的 object 是有区分的，所以不能简单的让每一个 object 看作一个模块，因为没有办法进行区分。假如更改为以下语法

```js
import {  createModule } from '@rustle/mp-store'

{
  a: createModule({
    c: createModule({

    }),
  }),
  b: createModule({
    d: createModule({

    }),
  }),
  f: {

  },
}
```

这样就可以区分哪些 object 是模块，哪些不是了。但是还有几个问题需要考虑，这是以上述语法建立模块体系必须要考虑到的问题
1. 模块之间是可以嵌套的？
2. 模块可以处于非模块的 object 中吗？
3. 模块可以随意删除和增改吗？
4. 模块如何合并？
5. 如果父模块中命名空间被占用，子模块需要使用相同的命名空间将如何处理？
6. 父模块创建的子模块，如果已经存在，是阻止创建还是合并？

以下回答是对上述问题的约定，也就是通过这种模块体系时，必须要遵守的约定，否则，将会导致整个模块体系的崩溃
+ 可以简单的理解为模块将将比普通字段的优先级更改，将有更严格的检测和限制

#### 模块之间是可以嵌套的？
模块之间必须是可以嵌套的，这是建立当前模块体系的基础，也就是说，下面 demo 是成立的
```js
{
  a: createModule({
    b: createModule({

    }),
  }),
}
```

#### 模块可以处于非模块的 object 中吗？
不允许，因为这将导致每一个普通对象的合并都需要大量的检测，带来的性能消耗太大，而且对非模块的 object 限制太大，下面的 demo 是不成立的
```js
// 在 mpstore 中，这种语法是不被允许的，但不是会报错
// 但这会导致 b 模块是个无效的模块，你将无法使用他，并且无法通过 mpstore 的一些列辅助语法得到他
// 所以千万不要这样写
{
  a: {
    b: createModule({}),
  },
}
```

#### 模块可以随意删除和增改吗？
模块不允许随意删除和新增，这意味着你无法在 setter 函数中新增和删除模块，你只能更改已经存在的模块，模块的新增只能通过添加 reducer 的形式新增
```js
store.add('action', {
  partialState: {
    a: createMoudule({})
  },
  setter (state, payload) {
    // 这会报错，因为 a 是一个模块，你不能删除他，变成其他的值
    return {
      a: {},
    }

    // 这样就不会报错，你只是更改 a 模块中的值
    return {
      a: createModule({
        name: 'tao',
      })
    }
  },
})
```

```js
store.add('action', {
  partialState: {
    a: createModule({})
  },
  setter (state, payload) {
    // 这会报错，因为 b 原本不是一个模块，所以你不能新增 b 模块
    return {
      b: createModule({}),
    }
  },
})
```

#### 模块如何合并？
在定义添加 reducer 的时候是可以合并相同 namespace 的模块的，但是其中定义的子模块是不能合并
1. 下面这个 demo 将是可以的，这会合并 `store.state.a` 这个模块
```js
store.add('one', {
  namespace: 'a',
  partialState: {
    name: 'tao',
  },
})

store.add('two', {
  namespace: 'a',
  partialState: {
    age: 24,
  },
})

console.log(store.getModule('a')) // { name: 'tao', age: 24 }
```

2. 下面这种语法将不能合并子模块 `a` 模块，因为 `a` 这个命名空间以及被占用，所以你无法重复定义
```js
store.add('one', {
  namespace: 'a',
  partialState: {},
})

store.add('two', {
  partialState: {
    a: createModule({}), // 这个会报错，因为 a 这个命名空间已经存在了，不管他是模块还是其他，都是不被允许的
  },
})
```

#### 如果父模块中命名空间被占用，子模块需要使用相同的命名空间将如何处理？
如果是在创建时，如果是通过 namespace 方式创建的将合并，否则将会报错。就是上一个 demo 演示的行为

#### 父模块创建的子模块，如果已经存在，是阻止创建还是合并？
在创建时，会阻止，并报错，在 setter 函数中将会合并，也就是上面那个 demo

## 如何使用
一般情况下，我们使用 module，可以使用 `store.addModule` 方法来创建一个 module。所以如果你需要使用应该是下面这种样子，也是最常用的样子

reducers.js
```js
import store from './store'

export const ONE = Symbol('one')
const oneReducer = {
  partialState: {
    name: 'taotao',
  },
  setter (moudle, payload, rootState) {
    return { name: payload }
  },
}

export const TWO = Symbol('two')
const twoReducer = {
  partialState: {
    age: 24,
  },
  setter (moudle, payload, rootState) {
    return { age: payload }
  },
}

store.addModule('user', {
  [ONE]: oneReducer,
  [TWO]: twoReducer,
})
```

Page
```js
import { ONE } from './reducers'
Page({
  storeConfig: {
    useState: () => ['user', {
      age: user => use.age,
      name: user => user.name,
    }]
  },

  change () {
    // 将更改视图为 chentao-24
    this.store.dispatch(ONE, 'chentao')
  }
})
```

Template taotao-24
```html
<view bindtap="change">{{ global.age }}-{{ global.name }}</view>
```