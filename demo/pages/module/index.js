// this is a demo for time travel
Page({
  storeConfig: {
    travelLimit: 5,
    defineReducer (store) {
      store.add('MODULE_STATE', {
        namespace: 'tao',
        partialState: {
          index: 0,
        },
        // setter (state, payload) {
        //   return { index: payload }
        // },
      })

      store.add('MODULE_STATE_1', {
        namespace: 'tao',
        partialState: {
          a: 0,
        },
        setter (state, payload) {
          return { a: payload }
        },
      })
    },

    useState: () => (['tao', {
      index: state => state.index,
    }]),
  },

  onLoad () {
    console.log(this.store)
  },

  change () {
    this.store.dispatch('MODULE_STATE', this.store.state.tao.index + 1)
    console.log(this.store.state)
  }
})