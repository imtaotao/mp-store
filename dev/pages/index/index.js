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
          1: 1,
        },
        setter (a, b) {
          console.log(a, b);
          return {
            1: b
          }
        }
      })
    },
    usedGlobalState () {
      return {
        1: store => store[1],
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
