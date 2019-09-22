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
  frameworks: ['jasmine'],
  basePath: path.resolve(__dirname),
  files: [
    'node_modules/miniprogram-simulate/build.js',
    'script/*.spec.js',
  ],
  preprocessors: {
    'script/*.spec.js': ['webpack', 'dirname', 'sourcemap'],
  },
  
  webpack: webpackConfig,
  webpackMiddleware: {
    noInfo: true,
  },
  plugins: [
    'karma-webpack',
    'karma-jasmine',
    'karma-mocha-reporter',
    'karma-sourcemap-loader',
    'karma-filemap-preprocessor',
    'karma-dirname-preprocessor',
  ]
}