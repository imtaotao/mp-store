//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    motto: 'Hello World',
  },

  onLoad () {},

  jump () {
    wx.navigateTo({
      url: '/pages/logs/logs',
    })
  },
})
