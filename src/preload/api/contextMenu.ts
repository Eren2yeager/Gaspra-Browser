import { ipcRenderer } from 'electron'

export const contextMenuAPI = {
  showContextMenu: (params: any) => ipcRenderer.send('show-context-menu', params),
  showInternalContextMenu: () => ipcRenderer.send('show-internal-context-menu'),
  showBrowserMenu: (state: Record<string, unknown>) =>
    ipcRenderer.send('show-browser-menu', state),
  onBrowserMenuAction: (cb: (data: { action: string; value?: unknown }) => void) => {
    const listener = (_event: any, data: { action: string; value?: unknown }) => cb(data)
    ipcRenderer.on('browser-menu-action', listener)
    return () => ipcRenderer.off('browser-menu-action', listener)
  },
  onOpenLinkInNewTab: (cb: (url: string) => void) => {
    const listener = (_event: any, url: string) => cb(url)
    ipcRenderer.on('open-link-in-new-tab', listener)
    return () => ipcRenderer.off('open-link-in-new-tab', listener)
  }
}
