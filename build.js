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

const banner =
  '/*!\n' +
  ` * Mpstore.js v${version}\n` +
  ` * (c) 2019-${new Date().getFullYear()} Imtaotao\n` +
  ' * Released under the MIT License.\n' +
  ' */'

const esm = {
  input: entryPath,
  output: {
    banner,
    format: 'es',
    file: outputPath(`${libName}.esm.js`),
  },
}

const es6m = {
  input: entryPath,
  output: {
    banner,
    format: 'es',
    file: outputPath(`${libName}.es6m.js`),
  },
}

const cjs = {
  input: entryPath,
  output: {
    banner,
    format: 'cjs',
    file: outputPath(`${libName}.common.js`),
  },
}

const uglifyCjs = {
  input: entryPath,
  output: {
    banner,
    format: 'cjs',
    file: outputPath(`${libName}.min.js`),
  },
}

// create env variable
const createReplacePlugin = () => {
  return replace({
    __VERSION__: `'${version}'`,
  })
}

async function build (cfg, needUglify, sourcemap = false, needBabel = true) {
  cfg.output.sourcemap = sourcemap

  const buildCfg = {
    input: cfg.input,
    plugins: [
      cleanup(),
      resolve(),
      cmd(),
      createReplacePlugin(),
    ]
  }

  if (needBabel) {
    buildCfg.plugins.splice(
      2, 0,
      babel({
        babelrc: false,
        exclude: 'node_modules/**',
        presets: [['@babel/preset-env', { modules: false }]],
      }),
    )
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
    // build es6 version
    build(es6m, false, sourcemap, false)
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