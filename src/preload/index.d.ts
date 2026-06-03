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
    }
  }
}
