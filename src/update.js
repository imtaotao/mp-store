function update (component, usedWords) {

}

export default function (deps, partialState) {
  const updateKeyWords = Object.keys(partialState)

  // Update component when the keyword found in the dependencies of a component
  for (let i = 0, len = deps.length; i < len; i++) {
    const needUpdateWords = []
    const { usedWords, component } = deps[i]
    
    if (Array.isArray(usedWords)) {
      const len = usedWords.length > updateKeyWords.length
        ? updateKeyWords.length
        : usedWords.length

      for (let i = 0; i < len; i++) {
        if (updateKeyWords.includes(usedWords[i])) {
          // needUpdateWords.push(`global.${}`)
        }
      }
    }
  }
}