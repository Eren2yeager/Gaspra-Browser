import { ipcRenderer } from 'electron'

export const searchHistoryAPI = {
  addSearch: (query: string) => ipcRenderer.invoke('add-search', query),
  getSearchHistory: (limit?: number) => ipcRenderer.invoke('get-search-history', limit),
  clearSearchHistory: () => ipcRenderer.invoke('clear-search-history'),
  deleteSearch: (id: number) => ipcRenderer.invoke('delete-search', id)
}
