import { ipcMain } from 'electron'
import { dbOperations } from '../../db'

export function registerBookmarkHandlers() {
  ipcMain.handle('add-bookmark', (_event, title: string, url: string) => {
    try {
      dbOperations.addBookmark(title, url)
      return { success: true }
    } catch (error: any) {
      console.error('Error adding bookmark:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('get-bookmarks', () => {
    try {
      const bookmarks = dbOperations.getBookmarks()
      return { success: true, bookmarks }
    } catch (error: any) {
      console.error('Error fetching bookmarks:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('delete-bookmark', (_event, id: number) => {
    try {
      dbOperations.deleteBookmark(id)
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting bookmark:', error)
      return { success: false, error: error.message }
    }
  })
}
