const base = require('./karma.base.config.js')

module.exports = function (config) {
  config.set(Object.assign(base, {
    singleRun: true,
    browsers: ['Chrome'],
    reporters: ['progress', 'mocha'],
    colors: {
      error: 'bgRed',
      success: 'blue',
      info: 'bgGreen',
      warning: 'cyan',
    },
    plugins: base.plugins.concat([
      'karma-chrome-launcher',
    ]),
  }))
}