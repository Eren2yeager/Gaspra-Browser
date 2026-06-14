import { ipcRenderer } from 'electron'

export const downloadsAPI = {
  getDownloads: () => ipcRenderer.invoke('get-downloads'),
  getDownloadsGrouped: () => ipcRenderer.invoke('get-downloads-grouped'),
  searchDownloads: (query: string) => ipcRenderer.invoke('search-downloads', query),
  clearDownloads: () => ipcRenderer.invoke('clear-downloads'),
  deleteDownload: (id: string) => ipcRenderer.invoke('delete-download', id),
  pauseDownload: (id: string) => ipcRenderer.invoke('pause-download', id),
  resumeDownload: (id: string) => ipcRenderer.invoke('resume-download', id),
  cancelDownload: (id: string) => ipcRenderer.invoke('cancel-download', id),
  onDownloadStarted: (cb: (data: any) => void) => {
    const listener = (_event: any, data: any) => cb(data)
    ipcRenderer.on('download-started', listener)
    return () => ipcRenderer.off('download-started', listener)
  },
  onDownloadUpdated: (cb: (data: any) => void) => {
    const listener = (_event: any, data: any) => cb(data)
    ipcRenderer.on('download-updated', listener)
    return () => ipcRenderer.off('download-updated', listener)
  },
  onDownloadDone: (cb: (data: any) => void) => {
    const listener = (_event: any, data: any) => cb(data)
    ipcRenderer.on('download-done', listener)
    return () => ipcRenderer.off('download-done', listener)
  }
}
