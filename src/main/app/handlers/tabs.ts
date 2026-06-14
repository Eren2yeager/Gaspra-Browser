import { ipcMain } from 'electron'
import { dbOperations } from '../../db'

export function registerTabHandlers() {
  ipcMain.handle('get-tabs', () => {
    try {
      const tabs = dbOperations.getTabs()
      return { success: true, tabs }
    } catch (error: any) {
      console.error('Error getting tabs:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('save-tabs', (_event, tabs: any[]) => {
    try {
      dbOperations.saveTabs(tabs)
      return { success: true }
    } catch (error: any) {
      console.error('Error saving tabs:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('clear-tabs', () => {
    try {
      dbOperations.clearTabs()
      return { success: true }
    } catch (error: any) {
      console.error('Error clearing tabs:', error)
      return { success: false, error: error.message }
    }
  })
}
