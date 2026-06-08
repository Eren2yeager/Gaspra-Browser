import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// db.ts import for database operations
app.commandLine.appendSwitch('ignore-certificate-errors')
import { dbOperations } from './db'

const activeDownloads = new Map<string, Electron.DownloadItem>()
const pausedDownloads = new Set<string>() // Tracks which downloads are paused
let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const windowIcon = process.platform === 'win32' ? join(process.cwd(), 'build', 'icon.ico') : icon

  // Create the browser window.
  const win = new BrowserWindow({
    width: 1380,
    height: 800,
    show: false,
    titleBarStyle: 'hidden',
    ...(process.platform === 'win32'
      ? {
          titleBarOverlay: {
            color: '#1f1f22',
            symbolColor: '#d4d4d8',
            height: 40
          }
        }
      : {}),
    autoHideMenuBar: true,
    ...(process.platform === 'linux' || process.platform === 'win32' ? { icon: windowIcon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true
    }
  })
  mainWindow = win

  win.on('ready-to-show', () => {
    win.show()
  })


  win.webContents.session.on('will-download', (_event, item) => {
    const filename = item.getFilename()
    let totalBytes = item.getTotalBytes()
    const url = item.getURL()
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // let user choose save location
    const savePath = dialog.showSaveDialogSync(win, {
      defaultPath: filename
    })

    if (!savePath) {
      item.cancel()
      return
    }

    activeDownloads.set(id, item)

    item.setSavePath(savePath)

    // save to db
    dbOperations.addDownload(id, filename, url, savePath, totalBytes, 'progressing')

    // notify renderer — download started
    win.webContents.send('download-started', {
      id,
      filename,
      url,
      savePath,
      totalBytes,
      receivedBytes: 0,
      state: 'progressing'
    })

    item.on('updated', (_, state) => {
      const receivedBytes = item.getReceivedBytes()
      // Update totalBytes if needed (sometimes it's only known after download starts)
      if (!totalBytes || totalBytes === 0) {
        totalBytes = item.getTotalBytes()
      }
      dbOperations.updateDownload(id, receivedBytes, state, totalBytes)
      win.webContents.send('download-updated', { 
        id, 
        receivedBytes, 
        totalBytes: totalBytes || item.getTotalBytes(),
        state 
      })
    })

    item.on('done', (_, state) => {
      const receivedBytes = item.getReceivedBytes()
      activeDownloads.delete(id)
      dbOperations.updateDownload(id, receivedBytes, state, totalBytes)
      win.webContents.send('download-done', { 
        id, 
        receivedBytes, 
        totalBytes: totalBytes || item.getTotalBytes(),
        state 
      })
    })
  })
  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  const rendererUrl = process.env['ELECTRON_RENDERER_URL'] || process.env['VITE_DEV_SERVER_URL']
  if (rendererUrl) {
    win.loadURL(rendererUrl)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC handlers for database operations
  // bookmark operations
  ipcMain.handle('add-bookmark', (_event, title: string, url: string) => {
    try {
      dbOperations.addBookmark(title, url)
      return { success: true }
    } catch (error: any) {
      console.error('Error adding bookmark:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('get-bookmarks', () => {
    try {
      const bookmarks = dbOperations.getBookmarks()
      return { success: true, bookmarks }
    } catch (error: any) {
      console.error('Error fetching bookmarks:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('delete-bookmark', (_event, id: number) => {
    try {
      dbOperations.deleteBookmark(id)
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting bookmark:', error)
      return { success: false, error: error.message }
    }
  })

  // history operations
  ipcMain.handle('add-history', (_event, title: string, url: string) => {
    try {
      dbOperations.addHistory(title, url)
      return { success: true }
    } catch (error: any) {
      console.error('Error adding history:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('get-history', () => {
    try {
      const history = dbOperations.getHistory()
      return { success: true, history }
    } catch (error: any) {
      console.error('Error fetching history:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('clear-history', () => {
    try {
      dbOperations.clearHistory()
      return { success: true }
    } catch (error: any) {
      console.error('Error clearing history:', error)
      return { success: false, error: error.message }
    }
  })

  // download operations
  ipcMain.handle('get-downloads', () => {
    try {
      const downloads = dbOperations.getDownloads()
      return { success: true, downloads }
    } catch (error: any) {
      console.error('Error fetching downloads:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('clear-downloads', () => {
    try {
      dbOperations.clearDownloads()
      return { success: true }
    } catch (error: any) {
      console.error('Error clearing downloads:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('delete-download', (_, id: string) => {
    try {
      dbOperations.deleteDownload(id)
      activeDownloads.delete(id)
      pausedDownloads.delete(id)
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting download:', error)
      return { success: false, error: error.message }
    }
  })

  // search history operations
  ipcMain.handle('add-search', (_, query: string) => {
    try {
      dbOperations.addSearch(query)
      return { success: true }
    } catch (error: any) {
      console.error('Error adding search history:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('get-search-history', (_, limit?: number) => {
    try {
      const searchHistory = dbOperations.getSearchHistory(limit ?? 10)
      return { success: true, searchHistory }
    } catch (error: any) {
      console.error('Error fetching search history:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('clear-search-history', () => {
    try {
      dbOperations.clearSearchHistory()
      return { success: true }
    } catch (error: any) {
      console.error('Error clearing search history:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('delete-search', (_, id: number) => {
    try {
      dbOperations.deleteSearch(id)
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting search history item:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('open-file', (_, filePath: string) => {
    try {
      shell.openPath(filePath)
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

  ipcMain.handle('pause-download', (_, id: string) => {
    const item = activeDownloads.get(id)
    if (item) {
      item.pause()
      pausedDownloads.add(id)
      
      // Update db and notify renderer
      const receivedBytes = item.getReceivedBytes()
      const totalBytes = item.getTotalBytes()
      dbOperations.updateDownload(id, receivedBytes, 'paused', totalBytes)
      
      if (mainWindow) {
        mainWindow.webContents.send('download-updated', {
          id, receivedBytes, totalBytes, state: 'paused' })
      }
    }
    return { success: true }
  })

  ipcMain.handle('resume-download', (_, id: string) => {
    const item = activeDownloads.get(id)
    if (item) {
      item.resume()
      pausedDownloads.delete(id)
      
      // Update db and notify renderer
      const receivedBytes = item.getReceivedBytes()
      const totalBytes = item.getTotalBytes()
      dbOperations.updateDownload(id, receivedBytes, 'progressing', totalBytes)
    }
    return { success: true }
  })

  ipcMain.handle('cancel-download', (_, id: string) => {
    const item = activeDownloads.get(id)
    if (item) {
      item.cancel()
      pausedDownloads.delete(id)
    }
    return { success: true }
  })

  ipcMain.handle('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
    return { success: true }
  })

  ipcMain.handle('window-toggle-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { success: false }

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

  // settings operations
  ipcMain.handle('get-settings', () => {
    try {
      const settings = dbOperations.getSettings()
      return { success: true, settings }
    } catch (error: any) {
      console.error('Error getting settings:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('update-setting', (_event, key: string, value: any) => {
    try {
      dbOperations.updateSetting(key as any, value)
      return { success: true }
    } catch (error: any) {
      console.error('Error updating setting:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('update-settings', (_event, partialSettings: any) => {
    try {
      dbOperations.updateSettings(partialSettings)
      return { success: true }
    } catch (error: any) {
      console.error('Error updating settings:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('reset-settings', () => {
    try {
      dbOperations.resetSettings()
      return { success: true }
    } catch (error: any) {
      console.error('Error resetting settings:', error)
      return { success: false, error: error.message }
    }
  })

  // tab operations
  ipcMain.handle('get-tabs', () => {
    try {
      const tabs = dbOperations.getTabs()
      return { success: true, tabs }
    } catch (error: any) {
      console.error('Error getting tabs:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('save-tabs', (_event, tabs: any[]) => {
    try {
      dbOperations.saveTabs(tabs)
      return { success: true }
    } catch (error: any) {
      console.error('Error saving tabs:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('clear-tabs', () => {
    try {
      dbOperations.clearTabs()
      return { success: true }
    } catch (error: any) {
      console.error('Error clearing tabs:', error)
      return { success: false, error: error.message }
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
