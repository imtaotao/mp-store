import {
  assert,
  isPlainObject,
} from './utils'

// a. modules allow nesting
// b. can't delete module, if module is created
// c. can't create new module in setter function
export const MODULE_FLAG = Symbol('module')

export function isModule (m) {
  return isPlainObject(m) && m[MODULE_FLAG] === true
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

// get module by namespace
export function getModule (state, namespace) {
  if (!namespace) return state
  let module = state
  const segments = namespace.split('.')

  for (let i = 0, len = segments.length; i < len; i++) {
    // every parent object must be a module
    if (!isModule(module)) return null
    module = module[segments[i]]
  }
  return isModule(module) ? module : null
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
      const originItem = module[key]
      const currentPartialItem = partialModule[key]
      const isModuleForOrigin = isModule(originItem)
      const isModuleForCurrent = isModule(currentPartialItem)

      assert(
        !(isModuleForOrigin && !isModuleForCurrent),
        `The namespace [${key}] is a module that you can change to other value, ` +
          'You can use `createModule` method to recreate a module.' + 
            '\n\n  --- from setter function.',
      )

      assert(
        !(!isModuleForOrigin && isModuleForCurrent),
        `The namespace [${key}] is not a module, you can't create it as a module, ` +
          'you must define the module in `reducer`.' + 
            '\n\n  --- from setter function.',
      )
      
      // allow merge child module
      if (isModuleForOrigin && isModuleForCurrent) {
        partialModule[key] = mergeModule(originItem, currentPartialItem)
      }
    }
  }

  return createModule(Object.assign({}, module, partialModule))
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
export function createModuleByNamespace (namespace, partialModule, rootModule, stringifyAction, createMsg) {
  if (!namespace) {
    return mergeModule(rootModule, partialModule)
  }

  let parentWraper = {}
  let parentModule = rootModule
  const moduleWraper = parentWraper
  const segments = namespace.split('.')
  const remaingMsg =  `\n\n  --- from [${stringifyAction}] action`

  for (let i = 0, len = segments.length; i < len; i++) {
    let childModule
    const key = segments[i]
    const isLastIndex = i === len - 1

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
    // the parentModule must be a module
    parentModule = childModule
  }

  return moduleWraper
}