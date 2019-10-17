import { applyPatchs } from './update'
import { diff, restore } from './diff'
import { warning, clone, assert } from './utils'

export default class TimeTravel {
  constructor (component, GLOBALWORD, limit) {
    this.history = []
    this.limit = limit
    this.component = component
    this.GLOBALWORD = GLOBALWORD
    this.length = this.history.length
    this.current = this.history.length
    this.finallyState = component.data[GLOBALWORD]
  }

  // only record diff patchs
  // so, can't restore to the state at initialization
  push (patchs) {
    const {
      limit,
      history,
      GLOBALWORD,
      history: { length },
      component: { data },
    } = this

    if (limit > 0) {
      // if exceed the limit, should to remove the extra item
      const extraCount = length - limit
      if (extraCount >= 0) {
        this.history.splice(0, extraCount + 1)
      }

      this.history.push(patchs)
      this.length = history.length
      this.current = history.length
      // need deep clone state
      this.finallyState = clone(data[GLOBALWORD])
    }
  }

  go (n) {
    if (this.limit > 0) {
      if (n !== 0) {
        const {
          current,
          history,
          component,
          GLOBALWORD,
          finallyState,
        } = this
        const backtrack = Math.abs(n)

        assert(
          GLOBALWORD in component.data,
          'You can\'t use [timeTravel] because it only works for [global state]',
        )

        const range = n + current
        if (range < 0 || range > history.length) {
          warning('[Index] is not within the allowed range.', true)
          return
        }

        let index = 0
        // deep clone patchs and state, we need keep state is immutable
        let data = clone(component.data[GLOBALWORD])

        while(index++ < backtrack) {
          const id = current + Math.sign(n) * index
          if (id < history.length) {
            const patchs = clone(history[id])
            data = restore(data, patchs)
          } else {
            data = finallyState
          }
        }

        const endPatchs = diff(component.data[GLOBALWORD], data, GLOBALWORD)
        if (endPatchs.length > 0) {
          applyPatchs(component, endPatchs, GLOBALWORD)
        }

        this.current += n
      }
    }
  }

  forward () {
    this.go(1)
  }

  back () {
    this.go(-1)
  }

  toStart () {
    this.go(-this.current)
  }

  toEnd () {
    this.go(this.history.length - this.current)
  }
}