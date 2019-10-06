## 测试用例
由于小程序官方推荐的测试库 `miniprogram-simulate` 太过于鸡肋，所以，与运行时有关的测试用例，放到小程序工程中

### json diff
+ [x] path 是否正确
+ [x] diff 后的 value 是否正确
+ [x] new data 中数组减少时是否全部替换
+ [x] new data 中数组增加时是否是单个逐个增加
+ [x] 多层嵌套的时候是否 diff 正确
+ [x] value 为 function 时是否使用旧值
+ [x] Date 类型的 value 是否使用新值
+ [x] 以上所有 diff 测试能否根据 patchs 复原

### reducer 定义（正反测试）
+ [ ] 不能添加重复的 reducer(action 相同的)
+ [ ] reducer 里面必须定义 `partialState` 字段
+ [ ] `partialState` 字段必须为一个普通对象
+ [ ] `partialState` 中不能有重复的全局字段
+ [ ] `setter` 函数没有将会被重置为默认函数，调用会抛出错误
+ [ ] `setter` 函数接受两个参数，全局 state 和 payload
+ [ ] `setter` 函数应该返回一个对象，将被合并进全局 state

### dispatch（正反测试）
+ [ ] 全局 state 将不可被更改
+ [ ] dispatch 的 action 不存在的时候报错
+ [ ] 不能再 dispatch 的时候再次调用 dispatch
+ [ ] dispatch 的时候能在中间件中再次调用 dispatch
+ [ ] dispatch 后，组件更新完毕后调用回调

### component config（正反测试）
+ [ ] `storeConfig` 配置项会被删除
+ [ ] `defineReducer` 方法在小程序初始化的时候调用，允许定义 reducer，接受一个参数为 store，上下文为 store
+ [ ] 没有 `usedGlobalState` 方法当前组件将不会被添加到依赖中
+ [ ] `usedGlobalState` 返回一个普通对象，对象中每个 value 是一个函数，将接受一个参数为全局 state，否则将不会添加到依赖中
+ [ ] 依赖添加将在 `onLoad` 和 `attached` 钩子之前，store 移除一样
+ [ ] 依赖移除将在 `onUnload` 和 `detached` 钩子之后，store 移除一样
+ [ ] `willUpdate` 将在当前组件更新之前调用，返回 false 将阻止更新，接受一个参数 newPartialState
+ [ ] `didUpdate` 将在组件更新完毕之后调用，接受两个参数，为 newPartialState 和 patchs

### setNamespace（正反测试）
+ [ ] 更改了使用的全局 state 命名空间，是否生效了

### mixin（正反测试）
+ [ ] 检查参数是否合法，两个参数，第一个为 string，第二个为 function
+ [ ] 不能混入重复的方法
+ [ ] 混入的方法在 组件 和 page 里面是否生效

### hooks（正反测试）
+ [ ] `createBefore` 在调用组件和 page 原生函数之前调用，接受两个参数，一个为 config，一个为是否是 page
+ [ ] `addDep` 在添加依赖之前调用，返回 false 将会阻止添加进依赖，接受两个参数，一个为组件，一个为是否是 page
+ [ ] `willUpdate` 在每个组件更新之前调用，返回 fakse 将阻止当前组件更新，将接受 5 个参数，component, newPartialState, patchs, isPage
+ [ ] `didUpdate` 将在每个组件更新之后调用，接受三个参数，component, newPartialState, isPage

### middleware（正反测试）
+ [ ] 如果没有指定 action，则默认为拦截所有 dispatch
+ [ ] 返回一个 remove 当前中间件的函数
+ [ ] 中间件函数接受两个参数，第一个为上一个中间件传递的 payload，第二个为 next（function）
+ [ ] 中间件如果没有调用 next 将不会更新
+ [ ] 中间件调用的顺序与添加的顺序保持一致