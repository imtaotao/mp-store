## 测试用例
由于小程序官方推荐的测试库 `miniprogram-simulate` 太过于鸡肋，所以，只对 `Componnet` 进行测试，`Page` 一部分测试需要放到小程序的运行时环境中去。很大一部分测试都需要正反测试，错误测试用 `[error]` 前缀标识

### json diff
+ [x] path 是否正确
+ [x] diff 后的 value 是否正确
+ [x] new data 中数组减少时是否全部替换
+ [x] new data 中数组增加时是否是单个逐个增加
+ [x] 多层嵌套的时候是否 diff 正确
+ [x] value 为 function 时是否使用旧值
+ [x] Date 类型的 value 是否使用新值
+ [x] 以上所有 diff 测试能否根据 patchs 复原
+ [x] restore 中 patch 的 path 不符合要求
+ [ ] diff 的所有测试用例都要分为 diff 逻辑层和视图层验证

### reducer 定义
+ [x] reducer 里面必须定义 `partialState` 字段
+ [x] `partialState` 字段必须为一个普通对象
+ [x] `partialState` 中不能有重复的全局字段
+ [x] `setter` 函数没有将会被重置为默认函数，调用会抛出错误
+ [x] `setter` 函数接受两个参数，全局 `state` 和 `payload`
+ [x] `setter` 函数应该返回一个对象，将被合并进全局 `state`
+ [x] 不能添加重复的 reducer(action 相同的)
+ [x] store 的 id 是唯一的

### dispatch
+ [x] 全局 state 将不可被更改
+ [x] dispatch 的 action 不存在的时候报错
+ [x] 不能再 dispatch 的时候再次调用 dispatch
+ [x] 更新完毕的回调中可以调用 dispatch
+ [x] 更新完毕的回调中可以增加新的 middleware
+ [x] dispatch 的时候能在中间件中再次调用 dispatch
+ [x] dispatch 后，组件更新完毕后调用回调
+ [x] 组件的 data 能否正常，视图能否正常更新
+ [x] 多级组件，父子组件之间能否正常更新
+ [x] 使用中间件，模拟异步行为时，多级组件，父子组件之间能否正常更新
+ [x] 更新的数据为一个函数时，行为是否正常

### component config
+ [x] `storeConfig` 配置项会被删除
+ [x] `defineReducer` 方法在小程序初始化的时候调用，允许定义 `reducer`，接受一个参数为 `store`，上下文为 `store`
+ [x] 没有 `usedGlobalState` 方法当前组件将不会被添加到依赖中
+ [x] `usedGlobalState` 返回一个普通对象，对象中每个 `value` 是一个函数，将接受一个参数为全局 `state`，否则将会报错
+ [x] 依赖添加将在 `onLoad` 和 `attached` 钩子之前，`store` 移除是同样的逻辑
+ [x] 依赖移除将在 `onUnload` 和 `detached` 钩子之后，`store` 移除是同样的逻辑
+ [x] `willUpdate` 将在当前组件更新之前调用，返回 false 将阻止更新，接受两个参数 为 `component、newPartialState`， `this 为 store`
+ [x] `didUpdate` 将在组件更新完毕之后调用，接受三个参数，为 `component、 newPartialState、patchs`， `this 为 store`
+ [x] 组件生成时的值与最开始存储的值不一致时，能否正常更新为新的值，这时的更新不会调用钩子

### setNamespace
+ [x] 默认的 `namespace` 是否正确
+ [x] `setNamespace` 参数检测
+ [x] 组件内部 data 上是否成功加上了
+ [x] 模板中能否正常使用

### mixin
+ [x] 检查参数是否合法，两个参数，第一个为 `string`，第二个为 `function`
+ [x] 不能混入重复的方法
+ [x] 混入的方法在 component 和 page 里面是否生效
+ [x] 如果原组件已经有相同的方法，则不会被混入

### hooks
+ [x] `createBefore` 在调用组件和 page 原生函数之前调用，接受两个参数，一个为 config，一个为是否是 page
+ [x] `addDep` 在添加依赖之前调用，返回 `false` 将会阻止添加进依赖，接受两个参数，一个为组件，一个为是否是 page
+ [x] `willUpdate` 在每个组件更新之前调用，返回 `fakse` 将阻止当前组件更新，将接受 5 个参数，`component、newPartialState、patchs、isPage`
+ [x] `didUpdate` 将在每个组件更新之后调用，接受三个参数，`component、newPartialState、isPage`
+ [x] `middlewareError` 将会捕捉中间件调用的时发出的错误，接受三个参数，`action、payload、error`
+ [x] 顺带单独测试 `applyPatchs` 这个内部方法

### middleware
+ [x] 如果没有指定 `action`，则默认为拦截所有 `dispatch`
+ [x] 拦截所有 `action`
+ [x] 检查中间件的数量
+ [x] 不允许在中间件调用的过程中增加新的中间件
+ [x] `setter` 函数中不能添加中间件
+ [x] 返回一个移除当前中间件的函数，用于删除当前中间件
+ [x] 中间件函数接受三个个参数，第一个为上一个中间件传递的 `payload`，第二个为 `next（function）`，第三个为当前的 `action`
+ [x] 中间件如果没有调用 `next` 将不会更新
+ [x] 中间件调用的顺序与添加的顺序保持一致