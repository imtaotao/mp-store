const path = require('path')
const automator = require('miniprogram-automator')

const opts = {
  projectPath: path.resolve(__dirname, './dev'),
}

// 工具 cli 位置，如果你没有更改过默认安装位置，可以忽略此项
if (process.argv.includes('-m')) {
  opts.cliPath =  path.resolve('D:/wechat-devtool/cli.bat')
}

automator.launch(opts).then(async miniProgram => {
  // ...
})