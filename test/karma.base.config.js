const path = require('path')

const webpackConfig = {
  module: {
    rules: [],
  },
  node: {
    __dirname: false,
  },
  devtool: '#inline-source-map',
}

module.exports = {
  webpack: webpackConfig,
  frameworks: ['jasmine'],
  basePath: path.resolve(__dirname),

  webpackMiddleware: {
    noInfo: true,
  },

  files: [
    'script/*.spec.js',
    'miniprogram-simulate.js',
  ],

  preprocessors: {
    'script/*.spec.js': ['webpack', 'dirname', /** 'sourcemap' **/],
  },
  
  plugins: [
    'karma-webpack',
    'karma-jasmine',
    'karma-mocha-reporter',
    'karma-sourcemap-loader',
    'karma-filemap-preprocessor',
    'karma-dirname-preprocessor',
  ],
}