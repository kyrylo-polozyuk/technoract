export const createKeyboardShortcutHandler = (
  shortcut: string,
  callback: (event: KeyboardEvent) => void,
  modKeys: string[] = [],
): (() => void) => {
  const handler = (event: KeyboardEvent) => {
    if (
      modKeys.length > 0 &&
      !modKeys.every((key) => event.getModifierState(key))
    ) {
      return
    }

    // Check direct key match
    if (event.key === shortcut) {
      event.preventDefault()
      callback(event)
      return
    }

    // Check for number keys (Digit1, Digit2, etc.)
    if (event.code === `Digit${shortcut}`) {
      event.preventDefault()
      callback(event)
      return
    }

    // Check case-insensitive match for letter keys
    if (
      shortcut.length === 1 &&
      event.key.toLowerCase() === shortcut.toLowerCase() &&
      event.key !== shortcut
    ) {
      event.preventDefault()
      callback(event)
    }
  }

  window.addEventListener("keydown", handler)
  return () => {
    window.removeEventListener("keydown", handler)
  }
}
