import { BrowserWindow } from 'electron'


import { registerBookmarkHandlers } from './bookmarks'
import { registerHistoryHandlers } from './history'
import { registerDownloadHandlers } from './downloads'
import { registerSearchHistoryHandlers } from './searchHistory'
import { registerSettingsHandlers } from './settings'
import { registerTabHandlers } from './tabs'
import { registerSystemHandlers } from './system'
import { registerWindowHandlers } from './window'

function registerHandlers(getMainWindow: () => any) {
  registerBookmarkHandlers()
  registerHistoryHandlers()
  registerDownloadHandlers(getMainWindow)
  registerSearchHistoryHandlers()
  registerSettingsHandlers(getMainWindow)
  registerTabHandlers()
  registerSystemHandlers()
  registerWindowHandlers()
}

export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null) {
  registerHandlers(getMainWindow)
}
