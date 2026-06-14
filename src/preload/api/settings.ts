import { ipcRenderer } from 'electron'

export const settingsAPI = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSetting: (key: string, value: any) => ipcRenderer.invoke('update-setting', key, value),
  updateSettings: (partialSettings: any) => ipcRenderer.invoke('update-settings', partialSettings),
  resetSettings: () => ipcRenderer.invoke('reset-settings')
}
