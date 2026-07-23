import { useEffect } from 'react'
import TabBar from './components/TabBar/TabBar'
import Toolbar from './components/Toolbar/Toolbar'
import WebView from './components/WebView/WebView'
import Sidebar from './components/Sidebar/Sidebar'
import LoadingProgressBar from './components/LoadingProgressBar/LoadingProgressBar'
import { BrowserProvider } from './context/BrowserContext'
import { BookmarkProvider } from './context/BookmarkContext'
import { HistoryProvider } from './context/HistoryContext'
import { DownloadProvider } from './context/DownloadContext'
import { SearchHistoryProvider } from './context/SearchHistoryContext'
import { SettingsProvider } from './context/SettingsContext'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function AppContent() {
  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  // Handle context menu for internal chrome pages (WebContentsViews handle their own)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      window.browserAPI.showInternalContextMenu()
    }

    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      <TabBar />
      <Toolbar />
      <LoadingProgressBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <WebView />
      </div>
    </div>
  )
}

function App() {
  return (
    <SettingsProvider>
      <BrowserProvider>
        <BookmarkProvider>
          <HistoryProvider>
            <DownloadProvider>
              <SearchHistoryProvider>
                <AppContent />
              </SearchHistoryProvider>
            </DownloadProvider>
          </HistoryProvider>
        </BookmarkProvider>
      </BrowserProvider>
    </SettingsProvider>
  )
}

export default App
