import { contextBridge ,ipcRenderer} from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const browserAPI = {
  addBookmark: (title: string, url: string) => ipcRenderer.invoke('add-bookmark', title, url),
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  deleteBookmark: (id: number) => ipcRenderer.invoke('delete-bookmark', id),
  addHistory: (title: string, url: string) => ipcRenderer.invoke('add-history', title, url),
  getHistory: () => ipcRenderer.invoke('get-history'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
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
