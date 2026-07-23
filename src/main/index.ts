import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { dbOperations } from './db/index'
import { createWindow } from './app/window'
import { registerIpcHandlers } from './app/handlers/index'
import { registerKeyboardShortcuts, unregisterKeyboardShortcuts } from './app/keyboardShortcuts'

app.commandLine.appendSwitch('ignore-certificate-errors') 

let mainWindow: BrowserWindow | null = null

function initializeApp() {
  electronApp.setAppUserModelId('com.electron')

  const initialSettings = dbOperations.getSettings()
  if (!initialSettings.hardwareAcceleration) {
    app.disableHardwareAcceleration()
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers(() => mainWindow)
  
  // Register keyboard shortcuts
  registerKeyboardShortcuts(() => mainWindow)

  // Context menus for tab WebContentsViews are wired in tabViews.ts

  mainWindow = createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
    }
  })
}

app.whenReady().then(initializeApp)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Unregister shortcuts when app quits
app.on('will-quit', () => {
  unregisterKeyboardShortcuts()
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
