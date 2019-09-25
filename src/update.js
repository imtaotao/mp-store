import { callHook } from './utils'
import { GLOBALWORD } from './store'
import { diff, restore } from './diff'

function applyPatchs (component, patchs) {
  const desObject = {}

  for (let i = 0, len = patchs.length; i < len; i++) {
    const { value, path } = patchs[i]
    desObject[path] = value
  }

  component.setData(desObject)
}

// update page and component
export default function updateComponent (deps, hooks) {
  for (let i = 0, len = deps.length; i < len; i++) {
    const { isPage, component, didUpdate, willUpdate, createState } = deps[i]

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
      const patchs = diff(component.data.global, newPartialState, GLOBALWORD)

      if (patchs.length > 0) {
        // call global hooks
        const params = [component, newPartialState, patchs, restore, isPage]
        if (callHook(hooks, 'willUpdate', params) === false) {
          continue
        }

        // update component
        applyPatchs(component, patchs)

        if (typeof didUpdate === 'function') {
          didUpdate(newPartialState)
        }
        callHook(hooks, 'didUpdate', [component, newPartialState, isPage])
      }
    }
  }
}