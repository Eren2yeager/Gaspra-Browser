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

function App() {
  // Handle context menu for internal pages
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Check if the event originated from or is within a webview
      let isWebview = false
      let element = e.target as HTMLElement | null
      while (element) {
        if (element.tagName === 'WEBVIEW') {
          isWebview = true
          break
        }
        element = element.parentElement
      }
      
      // Only handle internal pages (non-webview)
      if (!isWebview) {
        e.preventDefault()
        window.browserAPI.showInternalContextMenu()
      }
    }

    // Add event listener to the document
    document.addEventListener('contextmenu', handleContextMenu)

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  return (
    <SettingsProvider>
      <BrowserProvider>
        <BookmarkProvider>
          <HistoryProvider>
            <DownloadProvider>
              <SearchHistoryProvider>
                <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
                  <TabBar />
                  <Toolbar />
                  <LoadingProgressBar />
                  <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <WebView />
                  </div>
                </div>
              </SearchHistoryProvider>
            </DownloadProvider>
          </HistoryProvider>
        </BookmarkProvider>
      </BrowserProvider>
    </SettingsProvider>
  )
}

export default App
