import { globalShortcut } from 'electron'

let currentHotkey: string | null = null

export function setupHotkey(hotkey: string, callback: () => void): boolean {
  try {
    // Unregister previous hotkey if exists
    if (currentHotkey) {
      globalShortcut.unregister(currentHotkey)
    }

    // Register new hotkey
    const success = globalShortcut.register(hotkey, callback)

    if (success) {
      currentHotkey = hotkey
      console.log(`Hotkey registered: ${hotkey}`)
    } else {
      console.error(`Failed to register hotkey: ${hotkey}`)
    }

    return success
  } catch (error) {
    console.error('Error setting up hotkey:', error)
    return false
  }
}

export function updateHotkey(newHotkey: string, callback: () => void): boolean {
  return setupHotkey(newHotkey, callback)
}

export function unregisterHotkey(): void {
  if (currentHotkey) {
    globalShortcut.unregister(currentHotkey)
    currentHotkey = null
  }
}

export function getCurrentHotkey(): string | null {
  return currentHotkey
}
