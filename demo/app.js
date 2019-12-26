import createStore, { createModule } from './store/mpstore.esm'

const store = createStore(null, {
  createBefore (isPage, config) {
    // console.log(isPage, config)
  },
})

// store.addModule('a', {
//   clear: {
//     setter() {
//       return {
//         // b: createModule({
//         //   c: createModule({})
//         // })
//       }
//     },
//   }
// })

// store.addModule('a.b.c', {
//   setB: {
//     partialState: {
//       name: 'tao'
//     },
//     setter(state, payload) {
//       return { name: payload }
//     }
//   }
// })

store.add('setB', {
  partialState: {
    aaa: 'tao'
  },
  setter(state, payload) {
    return { aaa: payload }
  }
})

// console.clear()
// setTimeout(() => {
//   store.dispatch('clear')
//   console.log(store.state)
// }, 500)

store.dispatch('setB', 'chen')
console.log(store.state)

store.restore('setB')
console.log(store.state)
//app.js
App({})