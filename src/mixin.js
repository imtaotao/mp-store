import { assert } from './utils'

export default function (inject) {
  const expandMethods = Object.create(null)

  if (typeof inject === 'function') {
    const callback = (name, fn) => {
      assert(
        typeof name === 'string',
        `The mixed method name must a string.`,
      )

      assert(
        typeof fn === 'function',
        'The mixed method is not a function.'
      )

      assert(
        !(name in expandMethods),
        `The "${name}" is exist,`, +
          `Please don't repeat mixin.`
      )

      expandMethods[name] = fn
    }

    inject(callback)
  }
  return expandMethods
}