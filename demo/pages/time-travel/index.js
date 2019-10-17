// this is a demo for time travel
Page({
  storeConfig: {
    timeTravelLimit: 5,
    defineReducer (store) {
      store.add('TIMETRAVEL', {
        partialState: {
          index: 0,
        },
        setter (state, payload) {
          return { index: payload }
        },
      })
    },

    usedGlobalState: () => ({
      index: state => state.index,
    }),
  },

  changed () {
    this.store.dispatch('TIMETRAVEL', this.data.global.index + 1)
  },

  forward () {
    this.timeTravel.forward()
  },

  back () {
    this.timeTravel.back()
  },

  start () {
    this.timeTravel.start()
  },

  end () {
    this.timeTravel.end()
  },
})