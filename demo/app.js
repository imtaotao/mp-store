import createStore, { createModule } from './store/mpstore.esm'

const store = createStore(null, {
  createBefore (isPage, config) {
    // console.log(isPage, config)
  },
})

store.addModule('a', {
  clear: {
    setter() {
      return {
        // b: createModule({
        //   c: createModule({})
        // })
      }
    },
  }
})

store.addModule('a.b.c', {
  setB: {
    partialState: {
      name: 'tao'
    }
  }
})

console.clear()
setTimeout(() => {
  store.dispatch('clear')
  console.log(store.state)
}, 500)


//app.js
App({})