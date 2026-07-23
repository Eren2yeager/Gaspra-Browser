import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { bookmarksAPI } from './api/bookmarks'
import { historyAPI } from './api/history'
import { downloadsAPI } from './api/downloads'
import { filesAPI } from './api/files'
import { searchHistoryAPI } from './api/searchHistory'
import { windowAPI } from './api/window'
import { settingsAPI } from './api/settings'
import { tabsAPI } from './api/tabs'
import { tabViewsAPI } from './api/tabViews'
import { contextMenuAPI } from './api/contextMenu'
import { quickLinksAPI } from './api/quickLinks'
import { keyboardShortcutsAPI } from './api/keyboardShortcuts'

const browserAPI = {
  ...bookmarksAPI,
  ...historyAPI,
  ...downloadsAPI,
  ...filesAPI,
  ...searchHistoryAPI,
  ...windowAPI,
  ...settingsAPI,
  ...tabsAPI,
  ...tabViewsAPI,
  ...contextMenuAPI,
  ...quickLinksAPI,
  ...keyboardShortcutsAPI
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
