import { ipcMain } from 'electron'
import { dbOperations } from '../../db'

export function registerQuickLinkHandlers() {
  ipcMain.handle('get-quick-links', () => {
    try {
      const quickLinks = dbOperations.getQuickLinks()
      return { success: true, quickLinks }
    } catch (error: any) {
      console.error('Error fetching quick links:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('add-quick-link', (_event, title: string, url: string) => {
    try {
      const id = dbOperations.addQuickLink(title, url)
      return { success: true, id }
    } catch (error: any) {
      console.error('Error adding quick link:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('update-quick-link', (_event, id: number, title: string, url: string) => {
    try {
      dbOperations.updateQuickLink(id, title, url)
      return { success: true }
    } catch (error: any) {
      console.error('Error updating quick link:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('delete-quick-link', (_event, id: number) => {
    try {
      dbOperations.deleteQuickLink(id)
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting quick link:', error)
      return { success: false, error: error.message }
    }
  })
}
