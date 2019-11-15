Page({
  data: {
    modules: [
      ['模块', '/pages/module/index'],
      ['时光旅行', '/pages/time-travel/index'],
    ]
  },

  jumpToChildModule (e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url })
  },
})
