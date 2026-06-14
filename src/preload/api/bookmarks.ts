import { ipcRenderer } from 'electron'

export const bookmarksAPI = {
  addBookmark: (title: string, url: string) => ipcRenderer.invoke('add-bookmark', title, url),
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  deleteBookmark: (id: number) => ipcRenderer.invoke('delete-bookmark', id)
}
