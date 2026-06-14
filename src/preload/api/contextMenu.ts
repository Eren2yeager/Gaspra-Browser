import { ipcRenderer } from 'electron'

export const contextMenuAPI = {
  showContextMenu: (params: any) => ipcRenderer.send('show-context-menu', params),
  showInternalContextMenu: () => ipcRenderer.send('show-internal-context-menu'),
  onOpenLinkInNewTab: (cb: (url: string) => void) => {
    const listener = (_event: any, url: string) => cb(url)
    ipcRenderer.on('open-link-in-new-tab', listener)
    return () => ipcRenderer.off('open-link-in-new-tab', listener)
  }
}
