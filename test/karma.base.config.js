const path = require('path')
const webpack = require('webpack')

const webpackConfig = {
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __VERSION__: '"0.0.0"',
    }),
  ],
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
    'simulate.js',
    'script/*.spec.js',
    'miniprogram-simulate.js',
  ],

  preprocessors: {
    'script/*.spec.js': ['webpack', 'dirname', 'sourcemap'],
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