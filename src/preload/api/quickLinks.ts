import { ipcRenderer } from 'electron'

export const quickLinksAPI = {
  getQuickLinks: () => ipcRenderer.invoke('get-quick-links'),
  addQuickLink: (title: string, url: string) => ipcRenderer.invoke('add-quick-link', title, url),
  updateQuickLink: (id: number, title: string, url: string) =>
    ipcRenderer.invoke('update-quick-link', id, title, url),
  deleteQuickLink: (id: number) => ipcRenderer.invoke('delete-quick-link', id)
}
