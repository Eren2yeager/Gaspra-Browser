import { ipcMain } from 'electron'
import { createContextMenu, createInternalPageContextMenu } from '../contextMenu'

export function registerSystemHandlers() {
  ipcMain.on('show-context-menu', (event, params) => {
    createContextMenu(event, params)
  })

  ipcMain.on('show-internal-context-menu', (event) => {
    createInternalPageContextMenu(event)
  })
}
