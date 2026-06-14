import { ipcMain } from 'electron'
import { dbOperations } from '../../db'
import { activeDownloads, pausedDownloads } from '../downloads'

export function registerDownloadHandlers(getMainWindow: () => any) {
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

  ipcMain.handle('get-downloads-grouped', () => {
    try {
      const groupedDownloads = dbOperations.getDownloadsGroupedByDate()
      return { success: true, groupedDownloads }
    } catch (error: any) {
      console.error('Error fetching grouped downloads:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('search-downloads', (_, query: string) => {
    try {
      const results = dbOperations.searchDownloads(query)
      return { success: true, results }
    } catch (error: any) {
      console.error('Error searching downloads:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('pause-download', (_, id: string) => {
    const item = activeDownloads.get(id)
    if (item) {
      item.pause()
      pausedDownloads.add(id)
      const receivedBytes = item.getReceivedBytes()
      const totalBytes = item.getTotalBytes()
      dbOperations.updateDownload(id, receivedBytes, 'paused', totalBytes)
      const win = getMainWindow()
      if (win) {
        win.webContents.send('download-updated', {
          id,
          receivedBytes,
          totalBytes,
          bytesPerSecond: 0,
          state: 'paused'
        })
      }
    }
    return { success: true }
  })

  ipcMain.handle('resume-download', (_, id: string) => {
    const item = activeDownloads.get(id)
    if (item) {
      item.resume()
      pausedDownloads.delete(id)
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
}
