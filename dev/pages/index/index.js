//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    motto: 'Hello World',
  },

  storeConfig: {
    defineReducer (store) {
      store.add('name', {
        partialState: {
          a: 1,
        },
        setter (a, b) {
          console.log(a, b);
          return {
            a: b
          }
        }
      })

      store.add('name1', {
        partialState: {
          b: 1,
        }
      })
    },
    usedGlobalState () {
      return {
        name: store => store.a,
      }
    },
  },

  onLoad () {
    console.log(this.data);
    setTimeout(() => {
      this.store.dispatch('name', 333)
    })
  },

  jump () {
    wx.navigateTo({
      url: '/pages/logs/logs',
    })
  },
})
