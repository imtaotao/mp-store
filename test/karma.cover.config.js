const base = require('./karma.base.config.js')

module.exports = function (config) {
  var options = Object.assign(base, {
    browsers: ['ChromeHeadless', 'ChromeHeadlessNoSandbox'],
    reporters: ['mocha', 'coverage'],
    coverageReporter: {
      reporters: [
        { type: 'lcov', dir: '../coverage', subdir: '.' },
        { type: 'json', dir: '../coverage', subdir: '.' },
        { type: 'text-summary', dir: '../coverage', subdir: '.' },
      ],
    },
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox'],
      }
    },
    singleRun: true,
    plugins: base.plugins.concat([
      'karma-coverage',
      'karma-chrome-launcher',
    ]),
  })

  // add babel-plugin-istanbul for code instrumentation
  options.webpack.module.rules[0].options = {
    plugins: [['istanbul', {
      include: [
        'src/',
      ]
    }]],
  }

  config.set(options)
}
