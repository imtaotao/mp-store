import { createModule } from '../../store/mpstore.esm'

let i = 0
// this is a demo for time travel
Page({
  storeConfig: {
    travelLimit: 5,
    defineReducer (store) {
      // store.add('one', {
      //   partialState: {
      //     name: 'chen',
      //   },
      //   setter: (state, payload) => ({ name: payload })
      // })
      // store.add('two', {
      //   namespace: 'a',
      //   partialState: {
      //     age: 0,
      //   },
      //   setter: (state, payload) => ({ age: payload })
      // })
      // store.add('three', {
      //   namespace: 'a.b',
      //   partialState: {
      //     sex: 'man',
      //   },
      //   setter: (state, payload) => ({ sex: payload })
      // })
      
      const s = Symbol()
      store.addModule('a', {
        [s]: {
          partialState: {
            name: 'tao0',
          }
        },
        // 'bb': {
        //   partialState: {
        //     nameTwo: 'imtaotao',
        //   }
        // }
      })
   
      // store.addModule('a', {
      //   [Symbol()]: {
      //     partialState: {
      //       name: 'tao',
      //     }
      //   },
      // })
      // store.add('two', {
      //   namespace: 'a',
      //   partialState: {},
      // })
      // store.add('three', {
      //   namespace: 'a.b',
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
    travelLimit: 5,
    // useState () {
    //   return ['a.b', {
    //     sex: s => s.sex,
    //     name: (s, r) => r.name,
    //     age: (s, r) => r.a.age,
    //   }]
    // },
  },

  check (sex, name, age) {
    const expect = (val) => {
      return {
        toBe(v) {
          console.log(val === v)
        },
      }
    }
    expect(this.store.state.name).toBe(name)
    expect(this.store.state.a.b.sex).toBe(sex)
    expect(this.store.state.a.age).toBe(age)
  },

  onLoad () {
    console.log(this.store.state)
  },

  change () {
    const store = this.store
    if (i === 0) {
      store.dispatch('one', 'imtaotao')
      this.check('man', 'imtaotao', 0)
    } else if (i === 1) {
      store.dispatch('two', 20)
      this.check('man', 'imtaotao', 20)
    } else if (i === 2) {
      store.dispatch('three', 'women')
      this.check('women', 'imtaotao', 20)
    } else if (i === 3) {
      this.timeTravel.back()
    } else if (i === 4) {
      this.timeTravel.back()
    } else if (i === 5) {
      this.timeTravel.back()
    }
    i++
  }
})