const {createTransformer} = require('babel-jest')

module.exports = createTransformer({
  babelrc: false,
  configFile: false,
  presets: ['@babel/preset-flow'],
  plugins: ['babel-plugin-syntax-hermes-parser', '@babel/plugin-transform-modules-commonjs']
})
