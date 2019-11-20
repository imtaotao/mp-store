## 这是关于 diff 原理相关的介绍
由于小程序的架构是分为两条不同的线程来处理渲染和 js 逻辑，数据在他们之间通信需要转为 `json`，这样带来的通信消耗比较大，为了尽可能的减少通信的压力，我们对组件新旧两组数据进行 diff，我们只把真正变动的数据进行更新

+ [data diff 的源码](../src/diff.js)
+ [data diff 的单元测试](../test/script/diff.spec.js)

### 与普通 js 对象之间 diff 的区别
+ 如果新的数据中，数组变小，也就是 `newArray.length < oldArrar.length`，将会直接替换为新数组
+ 如果新的数据中，数组变大，也就是 `newArray.length > oldArrar.length`，将会对两组数据中的每一个 item 进行 diff
+ 如果是 `Date`， 将会直接替换
+ 如果是 `function`，将会直接替换 
+ 如果是正则，将会使用旧值，不做替换
+ 不会对 `symbol` 类型的数据做 diff

### 因为不会对 symbol 做 diff，所以 `partialState` 中定义的 symbol 将会出现一些不可预测的行为，比如 `partialState` 中只有 symbol 类型的数据时，将不会被添加到 store.state 中去