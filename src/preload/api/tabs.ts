import { ipcRenderer } from 'electron'

export const tabsAPI = {
  getTabs: () => ipcRenderer.invoke('get-tabs'),
  saveTabs: (tabs: any[]) => ipcRenderer.invoke('save-tabs', tabs),
  clearTabs: () => ipcRenderer.invoke('clear-tabs')
}
