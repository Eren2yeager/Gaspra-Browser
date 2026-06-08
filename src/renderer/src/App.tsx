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
