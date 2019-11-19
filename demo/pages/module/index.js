import { createModule } from '../../store/mpstore.esm'

// this is a demo for time travel
Page({
  storeConfig: {
    travelLimit: 5,
    defineReducer (store) {
      store.add('action', {
        partialState: {
          a: createModule({}),
        }
      })
      console.log(store.getModule('a'), 'tao')
      // store.add('two', {
      //   namespace: 'b',
      //   partialState: {},
      // })
      // store.add('three', {
      //   namespace: 'a.a',
      //   partialState: { a: 1 },
      // })
      // store.add('four', {
      //   namespace: 'a.a',
      //   partialState: { b: 2 },
      // })
      // store.add('MODULE_STATE_root', {
      //   // namespace: 'root',
      //   partialState: {
      //     taoo: createModule({
      //       parent: 1,
      //       tao: createModule({
      //         index: 1,
      //         fff: 121,
      //         c: createModule({
      //           aa: 1,
      //         })
      //       }),
      //     })
      //   },
      //   setter (state, payload) {
      //     return {
      //       taoo: createModule({
      //         parent: payload,
      //         tao: createModule({
      //           index: payload,
                
      //         })
      //       })
      //     }
      //   },
      // })

      // store.add('MODULE_STATE', {
      //   namespace: 'taoo',
      //   partialState: {
      //     cc: 1,
      //     // tao: {
      //     // }
      //   },
      //   setter (state, payload) {
      //     console.log(state, payload)
      //     return {
      //       cc: payload
      //     }
      //   }
      // })

      // store.add('MODULE_STATE_1', {
      //   namespace: 'taoo.tao.c',
      //   partialState: {
      //     index: 0,
      //   },
      // })

      // store.add('MODULE_STATE_2', {
      //   partialState: {
      //     abc: 0,
      //     cab: {
      //       fff: 121,
      //       __mpModule: true,
      //     }
      //   },
      // })

      // store.add('fff', {
      //   namespace: 'cab',
      //   partialState: {
      //     'taotao': 1221
      //   }
      // })
    },

    // useState: () => (['taoo.tao', {
    //   index: state => state.index,
    // }]),
  },

  onLoad () {
    console.log(this.store.state)
  },

  change () {
    this.store.dispatch('MODULE_STATE_root', this.store.getModule('taoo.tao').index + 1)
    console.log(this.store.state)
  }
})