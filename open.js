
const path = require('path')
const automator = require('miniprogram-automator')

const opts = {
  projectPath: path.resolve(__dirname, './demo'),
}

// wechat devtool's position, if no alter default install postion, you can ignore.
if (process.argv.includes('-m')) {
  opts.cliPath =  path.resolve('D:/wechat-devtool/cli.bat')
}

automator.launch(opts).then(async miniProgram => {
  // ...
})