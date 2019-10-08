import { diff } from './diff'
import { callHook } from './utils'
import { GLOBALWORD } from './store'

export function applyPatchs (component, patchs) {
  const desObject = {}

  for (let i = 0, len = patchs.length; i < len; i++) {
    const { value, path } = patchs[i]
    desObject[path] = value
  }

  component.setData(desObject)
}

// update page and component
export function updateComponents (deps, hooks) {
  const len = deps.length
  if (len <= 0) return

  for (let i = 0; i < len; i++) {
    const { isPage, component, didUpdate, willUpdate, createState } = deps[i]

    if (component.data[GLOBALWORD]) {
      const newPartialState = createState()

      // the `willUpdate` function will optimize component
      if (typeof willUpdate === 'function') {
        if (willUpdate(newPartialState) === false) {
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
          continue
        }

        // update component
        applyPatchs(component, patchs)

        if (typeof didUpdate === 'function') {
          didUpdate(newPartialState, patchs)
        }
        callHook(hooks, 'didUpdate', [component, newPartialState, isPage])
      }
    }
  }
}