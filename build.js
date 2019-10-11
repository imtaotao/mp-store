const fs = require('fs')
const path = require('path')
const rollup = require('rollup')
const rm = require('rimraf').sync
const babel = require('rollup-plugin-babel')
const cmd = require('rollup-plugin-commonjs')
const replace = require('rollup-plugin-replace')
const cleanup = require('rollup-plugin-cleanup')
const { terser } = require('rollup-plugin-terser')
const resolve = require('rollup-plugin-node-resolve')

const libName = 'mpstore'
const version = require('./package.json').version
const testLibPath = path.resolve(__dirname, './demo')
const devStoreDir = path.resolve(testLibPath, './store')
const entryPath = path.resolve(__dirname, './src/index.js')
const outputPath = filename => path.resolve(__dirname, './dist', filename)

const esm = {
  input: entryPath,
  output: {
    file: outputPath(`${libName}.esm.js`),
    format: 'es',
  },
}

const cjs = {
  input: entryPath,
  output: {
    file: outputPath(`${libName}.common.js`),
    format: 'cjs',
  },
}

const uglifyCjs = {
  input: entryPath,
  output: {
    file: outputPath(`${libName}.min.js`),
    format: 'cjs',
  },
}

// create env variable
const createReplacePlugin = () => {
  return replace({
    __VERSION__: `'${version}'`,
  })
}

async function build (cfg, needUglify, sourcemap = false) {
  cfg.output.sourcemap = sourcemap

  const buildCfg = {
    input: cfg.input,
    plugins: [
      cleanup(),
      resolve(),
      babel({
        babelrc: false,
        exclude: 'node_modules/**',
        presets: [['@babel/preset-env', { modules: false }]],
      }),
      cmd(),
      createReplacePlugin(),
    ]
  }

  if (needUglify) {
    buildCfg.plugins.unshift(
      terser({
        sourcemap: false,
      })
    )
  }

  const bundle = await rollup.rollup(buildCfg)
  await bundle.generate(cfg.output)
  await bundle.write(cfg.output)
}

console.clear()
// delete old build files
rm('./dist')
rm(devStoreDir)

const transferfile = (from, desPath) => {
  const readable = fs.createReadStream(from)
  readable.on('open', () => readable.pipe(fs.createWriteStream(desPath)))
}

const buildVersion = sourcemap => {
  const builds = [
    build(esm, false, sourcemap),
    build(cjs, false, sourcemap),
  ]
  if (!sourcemap) {
    builds.push(build(uglifyCjs, true, sourcemap))
  }

  Promise.all(builds).then(() => {
    // transfer esm package to dev folder
    if (fs.existsSync(testLibPath)) {
      if (!fs.existsSync(devStoreDir)) {
        fs.mkdirSync(devStoreDir)
      }

      const devStorePath = esm.output.file
      const desPath = path.join(devStoreDir, `${libName}.esm.js`)
      transferfile(devStorePath, desPath)
      if (sourcemap) {
        transferfile(devStorePath + '.map', desPath + '.map')
      }
    }
  })
}

// watch, use in dev and test
if (process.argv.includes('-w')) {
  let i = 0
  fs.watch('./src', () => {
    console.clear()
    console.log('Rebuild: ' + ++i)
    buildVersion(true)
  })
  buildVersion(true)
} else {
  buildVersion()
}