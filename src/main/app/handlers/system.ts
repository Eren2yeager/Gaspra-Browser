import { ipcMain } from 'electron'
import { createContextMenu, createInternalPageContextMenu } from '../contextMenu'
import { createBrowserMenu, type BrowserMenuState } from '../browserMenu'

export function registerSystemHandlers() {
  ipcMain.on('show-context-menu', (event, params) => {
    createContextMenu(event, params)
  })

  ipcMain.on('show-internal-context-menu', (event) => {
    createInternalPageContextMenu(event)
  })

  ipcMain.on('show-browser-menu', (event, state: BrowserMenuState) => {
    createBrowserMenu(event, state)
  })
}
