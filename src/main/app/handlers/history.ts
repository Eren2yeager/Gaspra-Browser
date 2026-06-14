import { ipcMain } from 'electron'
import { dbOperations } from '../../db'

export function registerHistoryHandlers() {
  ipcMain.handle('add-history', (_event, title: string, url: string) => {
    try {
      dbOperations.addHistory(title, url)
      return { success: true }
    } catch (error: any) {
      console.error('Error adding history:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('get-history', () => {
    try {
      const history = dbOperations.getHistory()
      return { success: true, history }
    } catch (error: any) {
      console.error('Error fetching history:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('clear-history', () => {
    try {
      dbOperations.clearHistory()
      return { success: true }
    } catch (error: any) {
      console.error('Error clearing history:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('get-history-grouped', () => {
    try {
      const groupedHistory = dbOperations.getHistoryGroupedByDate()
      return { success: true, groupedHistory }
    } catch (error: any) {
      console.error('Error fetching grouped history:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('search-history', (_event, query: string) => {
    try {
      const results = dbOperations.searchHistory(query)
      return { success: true, results }
    } catch (error: any) {
      console.error('Error searching history:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('delete-history-item', (_event, id: number) => {
    try {
      dbOperations.deleteHistoryItem(id)
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting history item:', error)
      return { success: false, error: error.message }
    }
  })
}
