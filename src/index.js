import {
  callHook,
  mixinMethods,
  createWraper,
  isEmptyObject,
} from './utils'
import mixin from './mixin'
import { Store } from './store'
export { clone } from './utils'
export { diff, restore } from './diff'
export { isModule, createModule } from './module'

export const version = __VERSION__

const nativePage = Page
const nativeComponent = Component

function expandConfig (config, expandMethods, isPage) {
  if (!isEmptyObject(expandMethods)) {
    if (isPage) {
      mixinMethods(config, expandMethods)
    } else {
      config.methods = config.methods || {}
      mixinMethods(config.methods, expandMethods)
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
      callHook(hooks, 'createBefore', [config, true])

      expandConfig(config, expandMethods, true)
    
      // the store will record all page and component
      // when global state changed, the dependent components will be update
      store.rewirteConfigAndAddDep(config, true)
    },
  )

  Component = createWraper(
    nativeComponent,
    function (config) {
      callHook(hooks, 'createBefore', [config, false])

      expandConfig(config, expandMethods, false)
      store.rewirteConfigAndAddDep(config, false)
    },
  )

  return store
}