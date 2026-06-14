import { ipcRenderer } from 'electron'

export const historyAPI = {
  addHistory: (title: string, url: string) => ipcRenderer.invoke('add-history', title, url),
  getHistory: () => ipcRenderer.invoke('get-history'),
  getHistoryGrouped: () => ipcRenderer.invoke('get-history-grouped'),
  searchHistory: (query: string) => ipcRenderer.invoke('search-history', query),
  deleteHistoryItem: (id: number) => ipcRenderer.invoke('delete-history-item', id),
  clearHistory: () => ipcRenderer.invoke('clear-history')
}
