import { ipcMain } from 'electron'
import { dbOperations } from '../../db'

export function registerSearchHistoryHandlers() {
  ipcMain.handle('add-search', (_, query: string) => {
    try {
      dbOperations.addSearch(query)
      return { success: true }
    } catch (error: any) {
      console.error('Error adding search history:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('get-search-history', (_, limit?: number) => {
    try {
      const searchHistory = dbOperations.getSearchHistory(limit ?? 10)
      return { success: true, searchHistory }
    } catch (error: any) {
      console.error('Error fetching search history:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('clear-search-history', () => {
    try {
      dbOperations.clearSearchHistory()
      return { success: true }
    } catch (error: any) {
      console.error('Error clearing search history:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('delete-search', (_, id: number) => {
    try {
      dbOperations.deleteSearch(id)
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting search history item:', error)
      return { success: false, error: error.message }
    }
  })
}
