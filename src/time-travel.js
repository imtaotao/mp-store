import { clone, assert } from './utils'

export default class TimeTravel {
  constructor (component, prevent) {
    this.history = []
    this.prevent = prevent
    this.component = component
    this.length = this.history.length
    this.current = this.history.length
  }

  push (patchs) {
    if (this.prevent > 0) {
      this.history.push(patchs)
    }
  }

  go (n) {
    let index = this.current + n

    assert(
      index > 0 && index < this.history.length,
      '[Index] is not within the allowed range.'
    )
      
    this.current = index

    while(index-- > 0) {
      // deep clone patchs
      const patch = clone(this.history[index])

    }
  }
}