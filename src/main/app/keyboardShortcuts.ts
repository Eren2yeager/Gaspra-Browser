import { globalShortcut, BrowserWindow } from 'electron'

function focusedWindow(fallback: () => BrowserWindow | null): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow() ?? fallback()
}

/**
 * Registers global and window-specific keyboard shortcuts for the browser
 */
export function registerKeyboardShortcuts(getMainWindow: () => BrowserWindow | null) {
  // Refresh page
  globalShortcut.register('CommandOrControl+R', () => {
    const win = focusedWindow(getMainWindow)
    if (win) {
      win.webContents.send('keyboard-shortcut', { action: 'refresh' })
    }
  })

  // Hard refresh (bypass cache)
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    const win = focusedWindow(getMainWindow)
    if (win) {
      win.webContents.send('keyboard-shortcut', { action: 'hard-refresh' })
    }
  })

  // New tab
  globalShortcut.register('CommandOrControl+T', () => {
    const win = focusedWindow(getMainWindow)
    if (win) {
      win.webContents.send('keyboard-shortcut', { action: 'new-tab' })
    }
  })

  // Close tab
  globalShortcut.register('CommandOrControl+W', () => {
    const win = focusedWindow(getMainWindow)
    if (win) {
      win.webContents.send('keyboard-shortcut', { action: 'close-tab' })
    }
  })

  // Next tab
  globalShortcut.register('CommandOrControl+Tab', () => {
    const win = focusedWindow(getMainWindow)
    if (win) {
      win.webContents.send('keyboard-shortcut', { action: 'next-tab' })
    }
  })

  // Previous tab
  globalShortcut.register('CommandOrControl+Shift+Tab', () => {
    const win = focusedWindow(getMainWindow)
    if (win) {
      win.webContents.send('keyboard-shortcut', { action: 'prev-tab' })
    }
  })

  // Toggle fullscreen
  globalShortcut.register('F11', () => {
    const win = focusedWindow(getMainWindow)
    if (win) {
      win.setFullScreen(!win.isFullScreen())
    }
  })

  // Toggle dev tools
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    const win = focusedWindow(getMainWindow)
    if (win) {
      win.webContents.toggleDevTools()
    }
  })
}

/**
 * Unregisters all keyboard shortcuts when the app quits
 */
export function unregisterKeyboardShortcuts() {
  globalShortcut.unregisterAll()
}
