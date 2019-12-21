import { createModule } from '../../store/mpstore.esm'

Page({
  storeConfig: {
    defineReducer (store) {
      store.add('one', {
        partialState: {
          name: 'chen',
        },
        setter (state, payload) {
          return {
            name: payload,
            a: createModule({
              age: 20,
              b: store.getModule('a.b'),
            }),
          }
        },
      })
      store.add('two', {
        namespace: 'a.b',
        partialState: {
          sex: 'man',
        },
        setter (state, payload) {
          return { sex: payload }
        },
      })
    },
    useState () {
      return ['a.b', {
        sex: s => s.sex,
        name: (s, r) => r.name,
        age: (s, r) => r.a.age,
      }]
    },
  },

  onLoad() {
    setTimeout(() => {
      this.store.dispatch('one', 'imtaotao')
    }, 1000)
    setTimeout(() => {
      this.store.dispatch('two', 'women')
    }, 2000)
  }
})