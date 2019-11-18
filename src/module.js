import {
  assert,
  parsePath,
  isPlainObject,
} from './utils'

// a. can't delete module, if module is created
// b. modules allow nesting
export const MODULE_FLAG = Symbol('__module')

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

  // inspect all attribute
  while(~--len) {
    const key = keys[len]
    // when create by reducer
    if (typeof createMsg === 'function') {
      assert(!(key in module), createMsg(key, moduleName))
    } else {
      // when changing by the setter function
      assert(
        !(isModule(module[key]) && !isModule(partialModule[key])),
        `The namespace [${key}] is a module that you can change to other value, ` +
          'You can use `createModule` method to recreate a module.',
      )
    }
  }

  return createModule(Object.assign({}, module, partialModule))
}

// the `__mpModule` flag is not allowed to be traversed
export function addModuleFlag (obj) {
  obj[MODULE_FLAG] = true
  return obj
}

export function createModule (obj) {
  assert(
    isPlainObject(obj),
    'The base module object must be an plain object',
  )

  if (isModule(obj)) {
    return obj
  }

  addModuleFlag(obj)
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
  const remaingMsg =  action ? `\n\n  --- from [${action.toString()}] action` : ''

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
          `because namespace [${key}] already exists in [${segments[i - 1] || 'root'}] module, ` +
            `but [${key}] not a module.${remaingMsg}`,
      )

      // the parentModule is module
      childModule = isLastIndex
        ? mergeModule(parentModule[key], partialModule, key, createMsg)
        : Object.assign({}, parentModule[key])
    } else {
      childModule = isLastIndex
        ? createModule(partialModule)
        : addModuleFlag({})
    }

    parentWraper[key] = childModule
    parentWraper = childModule
    parentModule = childModule
  }

  return moduleWraper
}