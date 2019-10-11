Page({
  data: {
    logs: []
  },

  onLoad () {
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map(log => {
        return new Date(log)
      })
    })
  },
})
