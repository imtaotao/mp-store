import diff from './diff'
import { callHook } from './utils'
import { GLOBALWORD } from './store'

function applyPatchs (component, patchs) {
  const desObject = {}

  for (let i = 0, len = patchs.length; i < len; i++) {
    const { type, value, path } = patchs[i]
    desObject[path] = value
  }

  component.setData(desObject)
}

// update page and component
export default function updateComponent (deps, hooks) {
  for (let i = 0, len = deps.length; i < len; i++) {
    const { component, didUpdate, willUpdate, createState } = deps[i]

    if (component.data.global) {
      const newPartialState = createState()

      // the `willUpdate` function will optimize component
      if (typeof willUpdate === 'function') {
        if (willUpdate(newPartialState) === false) {
          continue
        }
      }

      // the base path is `GLOBALWORD`
      // example: this.setData({ 'global.xx': xx })
      const patch = diff(component.data.global, newPartialState, GLOBALWORD)

      if (patch.length > 0) {
        // Call global hooks
        if (callHook(hooks,
          'willUpdate', [component, newPartialState, patch]) === false) {
          continue
        }

        // update component
        applyPatchs(component, patch)

        if (typeof didUpdate === 'function') {
          didUpdate(newPartialState)
        }
        callHook(hooks, 'didUpdate', [component, newPartialState])
      }
    }
  }
}