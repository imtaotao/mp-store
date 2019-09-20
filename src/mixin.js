import { assertError } from './utils'

export default function (inject) {
  const expandMethods = Object.create(null)

  if (typeof inject === 'function') {
    const callback = (name, fn) => {
      assertError(
        typeof name !== 'string' || typeof fn !== 'functin',
        `Mixed callback parameters are illegal.`,
      )

      assertError(
        name in expandMethods,
        `The "${name}" is exist,`, +
          `Please don't repeat mixin.`
      )

      expandMethods.name = fn
    }

    inject(callback)
  }

  return expandMethods
}