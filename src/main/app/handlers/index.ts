import { BrowserWindow } from 'electron'


import { registerBookmarkHandlers } from './bookmarks'
import { registerHistoryHandlers } from './history'
import { registerDownloadHandlers } from './downloads'
import { registerSearchHistoryHandlers } from './searchHistory'
import { registerSettingsHandlers } from './settings'
import { registerTabHandlers } from './tabs'
import { registerSystemHandlers } from './system'
import { registerWindowHandlers } from './window'
import { registerQuickLinkHandlers } from './quickLinks'
import { registerFileHandlers } from './files'

function registerHandlers(getMainWindow: () => any) {
  registerBookmarkHandlers()
  registerQuickLinkHandlers()
  registerHistoryHandlers()
  registerDownloadHandlers(getMainWindow)
  registerSearchHistoryHandlers()
  registerSettingsHandlers(getMainWindow)
  registerTabHandlers()
  registerSystemHandlers()
  registerWindowHandlers()
  registerFileHandlers()
}

export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null) {
  registerHandlers(getMainWindow)
}
