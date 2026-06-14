import { BrowserWindow, ipcMain, shell } from 'electron'

export function registerWindowHandlers() {
  ipcMain.handle('open-file', async (_, filePath: string) => {
    try {
      await shell.openPath(filePath)
      return { success: true }
    } catch (error: any) {
      console.error('Error opening file:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('show-in-folder', (_, filePath: string) => {
    try {
      shell.showItemInFolder(filePath)
      return { success: true }
    } catch (error: any) {
      console.error('Error showing in folder:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
    return { success: true }
  })

  ipcMain.handle('window-toggle-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) {
      return { success: false }
    }
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
    return { success: true, isMaximized: win.isMaximized() }
  })

  ipcMain.handle('window-is-maximized', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return { success: true, isMaximized: !!win?.isMaximized() }
  })

  ipcMain.handle('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.close()
    return { success: true }
  })
}
