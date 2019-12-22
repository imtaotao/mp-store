import { diff } from './diff'
import { callHook } from './utils'

export function applyPatchs (component, patchs, callback) {
  const destObject = {}

  for (let i = 0, len = patchs.length; i < len; i++) {
    const { value, path } = patchs[i]
    destObject[path] = value
  }

  component.setData(destObject, callback)
}

// update page and component
export function updateComponents (store, callback) {
  let total = 0
  const {
    hooks,
    GLOBALWORD,
    depComponents,
  } = store
  if (depComponents.length === 0) {
    callback()
    return
  }
  
  // the component maybe aleard unload, so, need copy
  const simulateDeps = depComponents.slice()
  const len = simulateDeps.length

  // call `callback`, when all component views are rendered
  const renderedCallback = () => {
    if (++total === len) {
      if (!callback._called) {
        callback._called = true
        callback()
      }
    }
  }
  
  for (let i = 0; i < len; i++) {
    const {
      isPage,
      component,
      didUpdate,
      willUpdate,
      createState,
    } = simulateDeps[i]

    // no update required if uninstalled
    if (component._$loaded && component.data[GLOBALWORD]) {
      const newPartialState = createState()

      // the `willUpdate` function will optimize component
      if (typeof willUpdate === 'function') {
        if (willUpdate.call(store, component, newPartialState) === false) {
          renderedCallback()
          continue
        }
      }

      // the base path is `GLOBALWORD`
      // example: this.setData({ 'global.xx': xx })
      const patchs = diff(component.data[GLOBALWORD], newPartialState, GLOBALWORD)

      if (patchs.length > 0) {
        // call global hooks
        const params = [component, newPartialState, patchs, isPage]
        if (callHook(hooks, 'willUpdate', params) === false) {
          renderedCallback()
          continue
        }

        // update component
        applyPatchs(component, patchs, renderedCallback)

        if (typeof didUpdate === 'function') {
          didUpdate.call(store, component, newPartialState, patchs)
        }
        
        callHook(hooks, 'didUpdate', [component, newPartialState, isPage])

        // record patchs, allow playback view
        if (component.timeTravel) {
          component.timeTravel.push(patchs)
        }
      } else {
        renderedCallback()
      }
    } else {
      renderedCallback()
    }
  }
}