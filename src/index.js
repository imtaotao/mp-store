import mixin from './mixin'
import Store from './store'
export { restore } from './diff'
import { callHook, createWraper, isEmptyObject } from './utils'

const nativePage = Page
const nativeComponent = Component

const expandConfig = (config, expandMethods, isPage) => {
  if (!isEmptyObject(expandMethods)) {
    if (isPage) {
      Object.assign(config, expandMethods)
    } else {
      if (config.methods) {
        Object.assign(config.methods, expandMethods)
      } else {
        config.methods = { ...expandMethods }
      }
    }
  }
}

export default function (mixinInject, hooks) {
  const store = new Store(hooks)
  const expandMethods = mixin(mixinInject)

  // we can rewirte Page and Component function
  // this will be better compatible with previous project
  Page = createWraper(
    nativePage,
    function (config) {
      // we allow add additional config attributes
      callHook(hooks, 'createBefore', [true, config])

      expandConfig(config, expandMethods, true)
    
      // the store will record all page and component
      // when global state changed, the dependent components will be update
      store._rewirteCfgAndAddDep(config, true)
    },
  )

  Component = createWraper(
    nativeComponent,
    function (config) {
      callHook(hooks, 'createBefore', [false, config])

      expandConfig(config, expandMethods, false)
      store._rewirteCfgAndAddDep(config, false)
    },
  )

  return store
}