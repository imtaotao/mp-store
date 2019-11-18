// this is a demo for time travel
Page({
  storeConfig: {
    travelLimit: 5,
    defineReducer (store) {
      store.add('MODULE_STATE_root', {
        partialState: {
          taoo: {
          //   aa: 111,
            __mpModule: true,
          //   tao: {
          //     __mpModule: true,
          //   }
          }
        },
        setter (state, payload) {
          return { index: payload }
        },
      })

      store.add('MODULE_STATE', {
        namespace: 'taoo.tao',
        partialState: {
          cc: 1,
        },
        setter (state, payload) {
          console.log(state, payload)
          return {
            cc: payload
          }
        }
      })

      store.add('MODULE_STATE_1', {
        namespace: 'taoo.tao',
        partialState: {
          index: 0,
        },
      })

      store.add('MODULE_STATE_2', {
        partialState: {
          abc: 0,
          cab: {
            fff: 121,
            __mpModule: true,
          }
        },
      })

      store.add('fff', {
        namespace: 'cab',
        partialState: {
          'taotao': 1221
        }
      })
    },

    useState: () => (['taoo.tao', {
      index: state => state.cc,
    }]),
  },

  onLoad () {
    console.log(this.store.state)
  },

  change () {
    this.store.dispatch('MODULE_STATE', this.store.getModule('taoo.tao').cc + 1)
    console.log(this.store.state)
  }
})