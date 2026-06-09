import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const browserAPI = {
  addBookmark: (title: string, url: string) => ipcRenderer.invoke('add-bookmark', title, url),
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  deleteBookmark: (id: number) => ipcRenderer.invoke('delete-bookmark', id),
  addHistory: (title: string, url: string) => ipcRenderer.invoke('add-history', title, url),
  getHistory: () => ipcRenderer.invoke('get-history'),
  getHistoryGrouped: () => ipcRenderer.invoke('get-history-grouped'),
  searchHistory: (query: string) => ipcRenderer.invoke('search-history', query),
  deleteHistoryItem: (id: number) => ipcRenderer.invoke('delete-history-item', id),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  getDownloads: () => ipcRenderer.invoke('get-downloads'),
  getDownloadsGrouped: () => ipcRenderer.invoke('get-downloads-grouped'),
  searchDownloads: (query: string) => ipcRenderer.invoke('search-downloads', query),
  clearDownloads: () => ipcRenderer.invoke('clear-downloads'),
  deleteDownload: (id: string) => ipcRenderer.invoke('delete-download', id),
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
  showInFolder: (filePath: string) => ipcRenderer.invoke('show-in-folder', filePath),
  addSearch: (query: string) => ipcRenderer.invoke('add-search', query),
  getSearchHistory: (limit?: number) => ipcRenderer.invoke('get-search-history', limit),
  clearSearchHistory: () => ipcRenderer.invoke('clear-search-history'),
  deleteSearch: (id: number) => ipcRenderer.invoke('delete-search', id),
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
  },
  pauseDownload: (id: string) => ipcRenderer.invoke('pause-download', id),
  resumeDownload: (id: string) => ipcRenderer.invoke('resume-download', id),
  cancelDownload: (id: string) => ipcRenderer.invoke('cancel-download', id),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window-toggle-maximize'),
  isWindowMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  // settings operations
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSetting: (key: string, value: any) => ipcRenderer.invoke('update-setting', key, value),
  updateSettings: (partialSettings: any) => ipcRenderer.invoke('update-settings', partialSettings),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),
  // tab operations
  getTabs: () => ipcRenderer.invoke('get-tabs'),
  saveTabs: (tabs: any[]) => ipcRenderer.invoke('save-tabs', tabs),
  clearTabs: () => ipcRenderer.invoke('clear-tabs'),
  // Context menu operations
  showContextMenu: (params: any) => ipcRenderer.send('show-context-menu', params),
  showInternalContextMenu: () => ipcRenderer.send('show-internal-context-menu'),
  onOpenLinkInNewTab: (cb: (url: string) => void) => {
    const listener = (_event: any, url: string) => cb(url)
    ipcRenderer.on('open-link-in-new-tab', listener)
    return () => ipcRenderer.off('open-link-in-new-tab', listener)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('browserAPI', browserAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.browserAPI = browserAPI
}
