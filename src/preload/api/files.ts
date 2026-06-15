import { ipcRenderer } from 'electron'

export const filesAPI = {
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
  showInFolder: (filePath: string) => ipcRenderer.invoke('show-in-folder', filePath),
  selectFile: (options: any) => ipcRenderer.invoke('select-file', options)
}
