import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    browserAPI: {
      addBookmark: (title: string, url: string) => Promise<{ success: boolean; error?: string }>
      getBookmarks: () => Promise<{ success: boolean; bookmarks?: any[]; error?: string }>
      deleteBookmark: (id: number) => Promise<{ success: boolean; error?: string }>
      addHistory: (title: string, url: string) => Promise<{ success: boolean; error?: string }>
      getHistory: () => Promise<{ success: boolean; history?: any[]; error?: string }>
      clearHistory: () => Promise<{ success: boolean; error?: string }>
      getDownloads: () => Promise<{ success: boolean; downloads?: any[]; error?: string }>
      clearDownloads: () => Promise<{ success: boolean; error?: string }>
      deleteDownload: (id: string) => Promise<{ success: boolean; error?: string }>
      openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
      showInFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>
      addSearch: (query: string) => Promise<{ success: boolean; error?: string }>
      getSearchHistory: (limit?: number) => Promise<{ success: boolean; searchHistory?: any[]; error?: string }>
      clearSearchHistory: () => Promise<{ success: boolean; error?: string }>
      deleteSearch: (id: number) => Promise<{ success: boolean; error?: string }>
      onDownloadStarted: (cb: (data: any) => void) => () => void
      onDownloadUpdated: (cb: (data: any) => void) => () => void
      onDownloadDone: (cb: (data: any) => void) => () => void
      pauseDownload: (id: string) => Promise<{ success: boolean; error?: string }>
      resumeDownload: (id: string) => Promise<{ success: boolean; error?: string }>
      cancelDownload: (id: string) => Promise<{ success: boolean; error?: string }> 
      minimizeWindow: () => Promise<{ success: boolean; error?: string }>
      toggleMaximizeWindow: () => Promise<{
        success: boolean
        isMaximized?: boolean
        error?: string
      }>
      isWindowMaximized: () => Promise<{ success: boolean; isMaximized?: boolean; error?: string }>
      closeWindow: () => Promise<{ success: boolean; error?: string }>
      // settings operations
      getSettings: () => Promise<{ success: boolean; settings?: any; error?: string }>
      updateSetting: (key: string, value: any) => Promise<{ success: boolean; error?: string }>
      updateSettings: (partialSettings: any) => Promise<{ success: boolean; error?: string }>
      resetSettings: () => Promise<{ success: boolean; error?: string }>
      // tab operations
      getTabs: () => Promise<{ success: boolean; tabs?: any[]; error?: string }>
      saveTabs: (tabs: any[]) => Promise<{ success: boolean; error?: string }>
      clearTabs: () => Promise<{ success: boolean; error?: string }>
      // context menu operations
      showContextMenu: (params: any) => void
      showInternalContextMenu: () => void
      onOpenLinkInNewTab: (cb: (url: string) => void) => () => void
    }
  }
}
