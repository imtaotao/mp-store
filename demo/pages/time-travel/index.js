// this is a demo for time travel
Page({
  storeConfig: {
    travelLimit: 5,
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

    useState: () => ({
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

  toStart () {
    this.timeTravel.toStart()
  },

  toEnd () {
    this.timeTravel.toEnd()
  },
})