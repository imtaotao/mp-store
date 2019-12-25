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
+ [x] 测试 deepClone 方法
+ [ ] diff 的所有测试用例都要分为 diff 逻辑层和视图层验证

### reducer 定义
+ [x] `action` 必须是 string 或者 symbol 类型
+ [x] `action` 是唯一的
+ [x] `namespace` 必须是 string 类型
+ [x] reducer 里面不一定需要 `partialState` 字段
+ [x] `partialState` 字段必须为一个普通对象
+ [x] `partialState` 中不能有重复的全局字段
+ [x] `partialState` 只拥有 symbol 类型的值时，将会判断为空对象，不添加
+ [x] `setter` 函数没有将会被重置为默认函数，调用会抛出错误
+ [x] `setter` 函数接受两个参数，`module`(全局 state 也是一个 module) 和 `payload`
+ [x] `setter` 函数应该返回一个对象，将被合并进 `module` (全局 state 也是一个 module)
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
+ [x] dispatch 后，组件更新完毕后调用回调，包含视图也更新
+ [x] 组件的 data 能否正常，视图能否正常更新
+ [x] 多级组件，父子组件之间能否正常更新
+ [x] 使用中间件，模拟异步行为时，多级组件，父子组件之间能否正常更新
+ [x] 更新的数据为一个函数时，行为是否正常

### component config
+ [x] `storeConfig` 配置项会被删除
+ [x] `defineReducer` 方法在小程序初始化的时候调用，允许定义 `reducer`，接受一个参数为 `store`，上下文为 `store`
+ [x] 没有 `useState` 方法当前组件将不会被添加到依赖中
+ [x] `useState` 返回一个普通对象，对象中每个 `value` 是一个函数，将接受一个参数为全局 `state`，否则将会报错
+ [x] `useState` 返回一个数组时，第一个参数为 namespace, 第二参数为对象，其中产生 state 的函数第一个参数为 `module`, 第二个为全局 `state`
+ [x] 依赖添加将在 `onLoad` 和 `attached` 钩子之前，`store` 添加是同样的逻辑，`timeTravel` 添加是同样的逻辑
+ [x] 依赖移除将在 `onUnload` 和 `detached` 钩子之后，`store` 不会被移除，`timeTravel` 不会被移除
+ [x] `willUpdate` 将在当前组件更新之前调用，返回 false 将阻止更新，接受两个参数 为 `component、newPartialState`， `this 为 store`
+ [x] `didUpdate` 将在组件更新完毕之后调用，接受三个参数，为 `component、 newPartialState、patchs`， `this 为 store`
+ [x] `addDep` 在添加依赖之前调用，返回 `false` 将会阻止添加进依赖，接受两个参数，一个为组件，一个为是否是 page，`this 为 store`
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
+ [x] 可以拦截 symbol action
+ [x] 如果没有指定 `action`，则默认为拦截所有 `dispatch`
+ [x] 拦截所有 `action`
+ [x] 检查中间件的数量
+ [x] 不允许在中间件调用的过程中增加新的中间件
+ [x] `setter` 函数中不能添加中间件
+ [x] 返回一个移除当前中间件的函数，用于删除当前中间件
+ [x] 中间件函数接受三个个参数，第一个为上一个中间件传递的 `payload`，第二个为 `next（function）`，第三个为当前的 `action`
+ [x] 中间件如果没有调用 `next` 将不会更新
+ [x] 中间件调用的顺序与添加的顺序保持一致
+ [x] 拦截的 action 可以为一个数组，用来拦截多个 action
+ [x] 可以拦截没有定义的 action

### time travel
+ [x] 检测 `go` 方法
+ [x] 检测 `back` 方法
+ [x] 检测 `forward` 方法
+ [x] 检测 `toStart` 方法
+ [x] 检测 `toEnd` 方法
+ [x] `travelLimit` 默认为 0
+ [x] `travelLimit` 必须是一个数字
+ [x] `travelLimit` 超出范围将不起作用
+ [x] `travelLimit` 超出最大栈记录不起作用
+ [x] 只对全局状态的更改才会被记录
+ [x] 如果没有使用全局状态，调用 `travelLimit` 的方法会报错
+ [x] 只对当前组件起作用
+ [x] 有新的全局状态改变将指针将重新指向最末端
+ [x] `history` 记录时，超过了指定的范围将丢弃前面的 `patchs`

### module
+ [x] global state 就是一个 module
+ [x] module 可以通过 `createModule` 方法来创建
+ [x] module 可以通过 namespace 来创建
+ [x] module 可以嵌套存在
+ [x] module 嵌套时，父级对象必须是 module
+ [x] module 嵌套时，如果父模块不是 module，getModule 将得到的是 null
+ [x] 如果创建的 module 命名空间在父 module 中被占用（但是占用的不是 module 时），则报错
+ [x] 如果创建的 module 命名空间在父 module 中被占用（但是占用是 module 时），则合并
+ [x] 如果创建的 module 命名空间在父 module 中被占用（但是占用是 module 时），则合并，合并时有相同的子命名空间，则报错（就是不能重复定义相同的字段）
+ [x] namespace 为空字符串时，相当于在全局模块中
+ [x] 如果通过 namespace 创建模块，父对象不存在时，默认新建一个空的父模块
+ [x] 如果通过 namespace 创建模块，父对象存在时，但不是一个模块时，则报错
+ [x] 如果通过 namespace 创建模块，父对象存在时，是一个模块时，则在其中新建子模块
+ [x] setter 函数返回的对象中，如果更改了其中的子模块，必须同样是模块，不能更改为其他的值（模块的优先级高一些），否则报错
+ [x] setter 函数返回的对象中，如果更改了其中的子模块，必须同样是模块，不能更改为其他的值（模块的优先级高一些），并且合并递归检测子模块的子模块，最终会替换子模块
+ [x] setter 函数返回的对象中，不能创建新的模块
+ [x] setter 函数返回的对象作用于当前 namespace 定义的模块
+ [x] setter 函数中第一个参数为 module, 第二个参数为 payload，如果有 namespace，第三个参数为全局 state
+ [x] setter 函数中，更改子模块，如果子模块中还有子模块，则不能删除，也不能新增
+ [x] 多级 module 与视图关联时，是否正确
+ [x] 与 middleware 联动时
+ [x] 与 timeTravel 联动时
+ [x] setter 函数返回的对象，如果对一个子模块进行更改，会检测这个子模块的子模块

### addModule
+ [x] 检查 namespace 的类型
+ [x] 允许重复添加，但不能有相同的 action
+ [x] 允许通过 symbol 和 string 作为 key
+ [x] 先添加 string 类型的 key，再添加 symbol 类型的 key
+ [x] reducer 中 namespace 将被替换为全局的 namespace
+ [x] 默认是调用 `store.add` 方法

### getModule
+ [x] 检查 namespace 的类型
+ [x] 如果没有 namespace  返回 state
+ [x] 如果有 remainMsg 则会检查模块是否存在，没有的话需要报错

### createModule 和 isModule
+ [x] createModule 时，如果本身就是一个 module，则返回自己
+ [x] createModule 将会添加一个 symbol 值作为标识符
+ [x] createModule 必须传入一个 plainObject
+ [x] isModule 检查时，必须是一个 plainObject
+ [x] isModule 将检查 symbol 标识符

### restore reducer

### update
+ [x] 更新的时候如果有组件卸载的话，是否所有的依赖的组件都能正常更新
+ [x] forceUpdate 行为是否正常
+ [X] restore 方法能否给恢复 reducer 到初始值