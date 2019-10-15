import { restore } from './diff'
import { applyPatchs } from './update'
import { clone, assert } from './utils'

export default class TimeTravel {
  constructor (component, GLOBALWORD, limit) {
    this.history = []
    this.limit = limit
    this.component = component
    this.GLOBALWORD = GLOBALWORD
    this.length = this.history.length
    this.current = this.history.length
  }

  push (patchs) {
    if (this.limit > 0) {
      this.history.push(patchs)
      this.length = this.history.length
    }
  }

  go (n) {
    if (this.limit > 0) {
      let index = this.current + n

      assert(
        index >= 0 && index < this.history.length,
        '[Index] is not within the allowed range.'
      )
      
      const component = this.component
      // deep clone patchs and state, we need keep state is immutable
      let data = clone(component.data)

      while(index-- >= 0) {
        const patchs = clone(this.history[index])
        data = restore(data, patchs)
      }

      const endPatchs = diff(component.data, data, this.GLOBALWORD)
      if (endPatchs.length > 0) {
        applyPatchs(component, endPatchs)
      }

      this.current = index
    }
  }

  forward () {
    this.go(1)
  }

  back () {
    this.go(-1)
  }

  start () {
    this.go(-this.current)
  }

  end () {
    this.go(this.history.length - this.current)
  }
}