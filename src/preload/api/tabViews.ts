import { ipcRenderer } from 'electron'

export type TabViewSnapshot = {
  id: number
  title: string
  url: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
}

export const tabViewsAPI = {
  getTabViewInit: () => ipcRenderer.invoke('tab-view-get-init'),
  setTabViewsOccluded: (occluded: boolean) =>
    ipcRenderer.invoke('tab-view-set-occluded', occluded),
  setTabViewBounds: (bounds: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.invoke('tab-view-set-bounds', bounds),
  ensureTabView: (tabId: number, url: string) =>
    ipcRenderer.invoke('tab-view-ensure', tabId, url),
  destroyTabView: (tabId: number) => ipcRenderer.invoke('tab-view-destroy', tabId),
  setActiveTabView: (tabId: number | null) =>
    ipcRenderer.invoke('tab-view-set-active', tabId),
  navigateTabView: (tabId: number, url: string) =>
    ipcRenderer.invoke('tab-view-navigate', tabId, url),
  goBackTabView: (tabId: number) => ipcRenderer.invoke('tab-view-go-back', tabId),
  goForwardTabView: (tabId: number) => ipcRenderer.invoke('tab-view-go-forward', tabId),
  reloadTabView: (tabId: number) => ipcRenderer.invoke('tab-view-reload', tabId),
  reloadTabViewIgnoringCache: (tabId: number) =>
    ipcRenderer.invoke('tab-view-reload-ignoring-cache', tabId),
  stopTabView: (tabId: number) => ipcRenderer.invoke('tab-view-stop', tabId),
  tearOffTabView: (payload: {
    tabId: number
    tab: TabViewSnapshot
    screenX: number
    screenY: number
  }) => ipcRenderer.invoke('tab-view-tear-off', payload),
  onTabViewAttached: (
    cb: (data: { tabId: number; tab: TabViewSnapshot }) => void
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: { tabId: number; tab: TabViewSnapshot }
    ) => cb(data)
    ipcRenderer.on('tab-view-attached', listener)
    return () => ipcRenderer.removeListener('tab-view-attached', listener)
  },
  onTabViewDetached: (cb: (data: { tabId: number }) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: { tabId: number }
    ) => cb(data)
    ipcRenderer.on('tab-view-detached', listener)
    return () => ipcRenderer.removeListener('tab-view-detached', listener)
  },
  onTabViewUpdated: (
    cb: (data: { tabId: number; changes: Record<string, unknown> }) => void
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: { tabId: number; changes: Record<string, unknown> }
    ) => cb(data)
    ipcRenderer.on('tab-view-updated', listener)
    return () => ipcRenderer.removeListener('tab-view-updated', listener)
  }
}
