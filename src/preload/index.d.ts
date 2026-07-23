import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    browserAPI: {
      addBookmark: (title: string, url: string) => Promise<{ success: boolean; error?: string }>
      getBookmarks: () => Promise<{ success: boolean; bookmarks?: any[]; error?: string }>
      deleteBookmark: (id: number) => Promise<{ success: boolean; error?: string }>
      getQuickLinks: () => Promise<{ success: boolean; quickLinks?: any[]; error?: string }>
      addQuickLink: (title: string, url: string) => Promise<{ success: boolean; id?: number; error?: string }>
      updateQuickLink: (id: number, title: string, url: string) => Promise<{ success: boolean; error?: string }>
      deleteQuickLink: (id: number) => Promise<{ success: boolean; error?: string }>
      addHistory: (title: string, url: string) => Promise<{ success: boolean; error?: string }>
      getHistory: () => Promise<{ success: boolean; history?: any[]; error?: string }>
      getHistoryGrouped: () => Promise<{ success: boolean; groupedHistory?: Record<string, any[]>; error?: string }>
      searchHistory: (query: string) => Promise<{ success: boolean; results?: any[]; error?: string }>
      deleteHistoryItem: (id: number) => Promise<{ success: boolean; error?: string }>
      clearHistory: () => Promise<{ success: boolean; error?: string }>
      getDownloads: () => Promise<{ success: boolean; downloads?: any[]; error?: string }>
      getDownloadsGrouped: () => Promise<{ success: boolean; groupedDownloads?: Record<string, any[]>; error?: string }>
      searchDownloads: (query: string) => Promise<{ success: boolean; results?: any[]; error?: string }>
      clearDownloads: () => Promise<{ success: boolean; error?: string }>
      deleteDownload: (id: string) => Promise<{ success: boolean; error?: string }>
      openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
      showInFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>
      selectFile: (options?: any) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>
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
      // WebContentsView tab ops
      getTabViewInit: () => Promise<{
        success: boolean
        init?: {
          tabs: Array<{
            id: number
            title: string
            url: string
            isLoading: boolean
            canGoBack: boolean
            canGoForward: boolean
          }>
          activeTabId: number
        } | null
        skipRestore?: boolean
      }>
      setTabViewsOccluded: (occluded: boolean) => Promise<{ success: boolean }>
      setTabViewBounds: (bounds: {
        x: number
        y: number
        width: number
        height: number
      }) => Promise<{ success: boolean }>
      ensureTabView: (tabId: number, url: string) => Promise<{ success: boolean }>
      destroyTabView: (tabId: number) => Promise<{ success: boolean }>
      setActiveTabView: (tabId: number | null) => Promise<{ success: boolean }>
      navigateTabView: (tabId: number, url: string) => Promise<{ success: boolean }>
      goBackTabView: (tabId: number) => Promise<{ success: boolean }>
      goForwardTabView: (tabId: number) => Promise<{ success: boolean }>
      reloadTabView: (tabId: number) => Promise<{ success: boolean }>
      reloadTabViewIgnoringCache: (tabId: number) => Promise<{ success: boolean }>
      stopTabView: (tabId: number) => Promise<{ success: boolean }>
      tearOffTabView: (payload: {
        tabId: number
        tab: {
          id: number
          title: string
          url: string
          isLoading: boolean
          canGoBack: boolean
          canGoForward: boolean
        }
        screenX: number
        screenY: number
      }) => Promise<{
        success: boolean
        mode?: 'attach' | 'new'
        targetWindowId?: number
      }>
      onTabViewUpdated: (
        cb: (data: { tabId: number; changes: Record<string, unknown> }) => void
      ) => () => void
      onTabViewAttached: (
        cb: (data: { tabId: number; tab: any }) => void
      ) => () => void
      onTabViewDetached: (cb: (data: { tabId: number }) => void) => () => void
      // context menu operations
      showContextMenu: (params: any) => void
      showInternalContextMenu: () => void
      showBrowserMenu: (state: Record<string, unknown>) => void
      onBrowserMenuAction: (
        cb: (data: { action: string; value?: unknown }) => void
      ) => () => void
      onOpenLinkInNewTab: (cb: (url: string) => void) => () => void
      onKeyboardShortcut: (cb: (data: { action: string }) => void) => () => void
    }
  }
}
