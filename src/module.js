import { assert, parsePath, isPlainObject } from './utils'

// 1. can't delete module, if module is created
// 2. modules allow nesting

export const MODULE_FLAG = '__mpModule'

export function isModule (m) {
  return isPlainObject(m) && m[MODULE_FLAG] === true
}

export function getModule (state, namespace) {
  return namespace
    ? parsePath(namespace)(state)
    : state
}

export function mergeModule (module, partialModule, createMsg) {
  const keys = Object.keys(partialModule)
  let len = keys.length

  while(~--len) {
    const key = keys[len]

    // inspect all attribute
    if (createMsg) {
      assert(!(key in module), createMsg)
    } else {
      assert(
        !(isModule(module[key]) && !isModule(partialModule[key])),
        `The [${key}] is a module that you can change to other values.`,
      )
    }
  }
  return Object.assign({}, module, partialModule)
}

export function createModule (obj) {
  assert(
    isPlainObject(obj),
    'The base module object must be an plain object',
  )

  if (isModule(obj)) return obj

  assert(
    !(MODULE_FLAG in obj),
    `the [${MODULE_FLAG}] is the keyword of the mpStore module, you can't use it`,
  )

  obj[MODULE_FLAG] = true
  return obj
}

// 1. if want to define a module, the parent and child modules must be modules.
// demo:
//   store.add('action', {
//     __mpModule: true,
//      childModule: {
//       __mpModule: true,
//     }
//   })
// 
// 2. if create new module, we need jugement the namespace whether in parent module
export function createModuleByNamespace (namespace, partialModule, rootModule, action) {
  if (!namespace) {
    return mergeModule(rootModule, partialModule)
  }

  let parentWraper = {}
  let parentModule = rootModule
  const moduleWraper = parentWraper
  const segments = namespace.split('.')
  const remaingMsg =  action ? `\n\n  --- from [${action}] action` : ''

  for (let i = 0, len = segments.length; i < len; i++) {
    const key = segments[i]

    // the global state certainly module
    if (i > 0) {
      assert(
        isModule(parentModule),
        'the child modules must be in the parent module.\n\n' +
          ` parent module namespace is [${key}]\n\n` +
            ` child module namespace is [${segments[i - 1]}]${remaingMsg}`, 
      )
    }

    if (key in parentModule) {
      assert(
        isModule(parentModule[key]),
        'you can\'t create child moudle, ' +
          `because the [${key}] already exists in [${segments[i - 1] || 'root'}] module, ` +
            `but [${key}] not a module.${remaingMsg}`,
      )

      // the parentModule is module
      const childModule = i === len - 1
        ? mergeModule(parentModule[key], partialModule)
        : parentModule[key]
      
      parentWraper[key] = childModule
      parentWraper = childModule
    } else {
      const childModule = i === len - 1
        ? createModule(partialModule)
        : { __mpModule: true }

      parentWraper[key] = childModule
      parentWraper = childModule
    }

    parentModule = parentModule[key]
  }
  return moduleWraper
}


// const state = {
//   a: 1,
//   b: createModule({
//     ba: 1,
//     c: createModule({
//       name: 'tao'
//     }),
//     d: createModule({
//       dm: createModule({
//         ab: 'code',
//         arr: [121],
//         child: {
//           name: 'chen',
//           __mpModule: true,
//         }
//       })
//     })
//   })
// }

// const namespace = ''
// const module = getModule(state, namespace)
// const newPModule = createModuleByNamespace(namespace, {
//   aaa: 121,
//   dm: {
//     __mpModule: true
//   }
// }, state, 'test')
// console.log(module)
// console.log(newPModule)