import createStore from './store/mpstore.esm'

const store = createStore(null, {
  createBefore (isPage, config) {
    console.log(isPage, config)
  },
})

//app.js
App({})