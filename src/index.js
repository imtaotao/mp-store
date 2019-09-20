import mixin from './mixin'
import Store from './store'
import { isEmptyObject } from './utils'

export const nativePage = Page
export const nativeComponent = Component

const expandConfig = (config, expandObj, isPage) => {
  if (!isEmptyObject(expandObj)) {
    if (isPage) {
      Object.assign(config, expandObj)
    } else {
      if (config.methods) {
        Object.assign(config.methods, expandObj)
      } else {
        config.methods = { ...expandObj }
      }
    }
  }
}

export default function (mixinInject, createHook) {
  const store = new Store()
  const expandObj = mixin(mixinInject)
  const canCallHook = typeof createHook === 'function'
  
  // We need rewirte Page and Component function
  // This will be better compatible with previous project
  Page = function (config) {
    expandConfig(config, expandObj, true)
    
    // The store will record all page and component
    // When global state changed, the dependent components will be update
    store._rewirteCfgAndAddDep(config, true)

    // We allow add additional config attributes
    if (canCallHook) createHook(config, true)
    nativePage.call(this, config)
  }

  Component = function (config) {
    expandConfig(config, expandObj, false)
    store._rewirteCfgAndAddDep(config, false)

    if (canCallHook) createHook(config, true)
    nativeComponent.call(this, config)
  }

  return store
}