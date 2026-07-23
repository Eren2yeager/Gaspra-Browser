import { ipcRenderer } from 'electron'

/**
 * Keyboard shortcuts API for the renderer process
 */
export const keyboardShortcutsAPI = {
  /**
   * Registers a callback to handle keyboard shortcut events from main process
   */
  onKeyboardShortcut: (
    callback: (data: { action: string }) => void
  ) => {
    const handler = (_event: any, data: { action: string }) => callback(data)
    ipcRenderer.on('keyboard-shortcut', handler)
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('keyboard-shortcut', handler)
    }
  }
}
