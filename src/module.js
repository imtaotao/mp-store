import { assert, parsePath, isPlainObject } from './utils'

// a. can't delete module, if module is created
// b. modules allow nesting
export const MODULE_FLAG = '__mpModule'

export function isModule (m) {
  return isPlainObject(m) && m[MODULE_FLAG] === true
}

export function getModule (state, namespace) {
  return namespace
    ? parsePath(namespace)(state)
    : state
}

export function mergeModule (module, partialModule, moduleName, createMsg) {
  const keys = Object.keys(partialModule)
  let len = keys.length

  while(~--len) {
    const key = keys[len]
    // inspect all attribute
    if (typeof createMsg === 'function') {
      assert(!(key in module), createMsg(key, moduleName))
    } else {
      assert(
        !(isModule(module[key]) && !isModule(partialModule[key])),
        `The [${key}] is a module that you can change to other values.`,
      )
    }
  }
  return createModule(Object.assign({}, module, partialModule))
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

  // the `__mpModule` is not allowed to be traversed
  Object.defineProperty(obj, MODULE_FLAG, {
    value: true,
    writable: false,
    enumerable: false,
    configurable: false,
  })

  return obj
}

// a. if want to define a module, the parent and child modules must be modules.
// demo:
//   store.add('action', {
//     __mpModule: true,
//      childModule: {
//       __mpModule: true,
//     }
//   })
// 
// b. if create new module, we need jugement the namespace whether in parent module
export function createModuleByNamespace (namespace, partialModule, rootModule, action, createMsg) {
  if (!namespace) {
    return mergeModule(rootModule, partialModule)
  }

  let parentWraper = {}
  let parentModule = rootModule
  const moduleWraper = parentWraper
  const segments = namespace.split('.')
  const remaingMsg =  action ? `\n\n  --- from [${action}] action` : ''

  for (let i = 0, len = segments.length; i < len; i++) {
    let childModule
    const key = segments[i]
    const isLastIndex = i === len - 1

    // the global state certainly module
    if (i > 0) {
      assert(
        isModule(parentModule),
        'the child modules must be in the parent module.\n\n' +
          `  the parent module namespace is [${segments[i - 1]}]\n\n` +
            `  the child module namespace is [${key}]${remaingMsg}`, 
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
      childModule = isLastIndex
        ? mergeModule(parentModule[key], partialModule, key, createMsg)
        : createModule(Object.assign({}, parentModule[key]))
    } else {
      childModule = isLastIndex
        ? createModule(partialModule)
        : createModule({})
    }

    parentWraper[key] = childModule
    parentWraper = childModule
    parentModule = childModule
  }
  return moduleWraper
}