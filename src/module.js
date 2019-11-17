import { assert, parsePath, isPlainObject } from './utils'

// 1. can't delete module, if module is created
// 2. modules allow nesting

export const MODULE_FLAG = '__mpModule'

export function isModule (obj) {
  return isPlainObject(obj) && obj[MODULE_FLAG] === true
}

export function getModule (state, namespace) {
  return parsePath(namespace)(state)
}

export function mergeModule (module, partialModule, needInspect) {
  if (needInspect) {
    const keys = Object.keys(partialModule)
    let len = keys.length

    while(~--len) {
      const key = keys[len]

      assert(
        isModule(module[key]) && !isModule(partialModule[key]),
        `The [${key}] is a module that you can change to other values.`,
      )
    }
  }
  
  return Object.assign({}, module, partialModule)
}

export function createModule (baseModule) {
  assert(
    isPlainObject(baseModule),
    'The base module object must be an plain object',
  )

  if (isModule(baseModule)) return baseModule

  assert(
    !(MODULE_FLAG in baseModule),
    `the [${MODULE_FLAG}] is the keyword of the mpStore module, you can't use it`,
  )

  baseModule[MODULE_FLAG] = true
  return baseModule
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
export function createModuleByNamespace (namespace, state, action) {
  let parentWraper = {}
  let parentModule = state
  const moduleWraper = parentWraper
  const segments = namespace.split('.')

  for (let i = 0, len = segments.length; i < len; i++) {
    const key = segments[i]

    // the global state certainly module
    if (i > 0) {
      assert(
        isModule(parentModule),
        'the child modules must be in the parent module.\n\n' +
          `parent module namespace is [${key}]\n\n` +
          `child module namespace is [${segments[i - 1]}]` + 
            action ?
              `\n\n --- from [${action}] action`
              : '',
      )
    }

    if (key in parentModule) {
      assert(
        isModule(parentModule[key]),
        'you can\'t create child moudle, ' +
          `because the [${key}] already exists in [${segments[i - 1] || 'global'}] state.` +
            action ?
              `\n\n --- from [${action}] action`
              : '',
      )
    } else {
      const childModule = {
        [MODULE_FLAG]: true,
      }
      parentWraper[key] = childModule
      parentWraper = childModule
    }
    
    parentModule = state[key]
  }

  return moduleWraper
}