import { BrowserWindow, dialog } from 'electron'
import { join } from 'path'
import { dbOperations } from '../db'

export const activeDownloads = new Map<string, Electron.DownloadItem>()
export const pausedDownloads = new Set<string>()

export function setupDownloadListeners(win: BrowserWindow) {
  win.webContents.session.on('will-download', (_event, item) => {
    const filename = item.getFilename()
    let totalBytes = item.getTotalBytes()
    const url = item.getURL()
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const settings = dbOperations.getSettings()
    let lastReceivedBytes = 0
    let lastProgressTimestamp: number | null = null

    let savePath: string | undefined
    if (settings.askWhereToSave) {
      savePath = dialog.showSaveDialogSync(win, {
        defaultPath: filename
      })
    } else {
      savePath = join(settings.downloadPath, filename)
    }

    if (!savePath) {
      item.cancel()
      return
    }

    activeDownloads.set(id, item)
    item.setSavePath(savePath)

    if (settings.saveDownloadHistory) {
      dbOperations.addDownload(id, filename, url, savePath, totalBytes, 'progressing')
    }

    win.webContents.send('download-started', {
      id,
      filename,
      url,
      savePath,
      totalBytes,
      receivedBytes: 0,
      bytesPerSecond: 0,
      state: 'progressing'
    })

    item.on('updated', (_, state) => {
      const receivedBytes = item.getReceivedBytes()
      const now = Date.now()
      let bytesPerSecond = 0

      if (state === 'progressing') {
        if (lastProgressTimestamp !== null) {
          const elapsedMs = now - lastProgressTimestamp
          const deltaBytes = receivedBytes - lastReceivedBytes

          if (elapsedMs > 0 && deltaBytes >= 0) {
            bytesPerSecond = Math.round((deltaBytes * 1000) / elapsedMs)
          }
        }

        lastReceivedBytes = receivedBytes
        lastProgressTimestamp = now
      } else {
        lastReceivedBytes = receivedBytes
        lastProgressTimestamp = null
      }

      if (!totalBytes || totalBytes === 0) {
        totalBytes = item.getTotalBytes()
      }

      if (settings.saveDownloadHistory) {
        dbOperations.updateDownload(id, receivedBytes, state, totalBytes)
      }

      win.webContents.send('download-updated', {
        id,
        receivedBytes,
        totalBytes: totalBytes || item.getTotalBytes(),
        bytesPerSecond,
        state
      })
    })

    item.on('done', (_, state) => {
      const receivedBytes = item.getReceivedBytes()
      activeDownloads.delete(id)
      if (settings.saveDownloadHistory) {
        dbOperations.updateDownload(id, receivedBytes, state, totalBytes)
      }
      win.webContents.send('download-done', {
        id,
        receivedBytes,
        totalBytes: totalBytes || item.getTotalBytes(),
        bytesPerSecond: 0,
        state
      })
    })
  })
}
