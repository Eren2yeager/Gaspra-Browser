import TabBar from './components/TabBar/TabBar'
import Toolbar from './components/Toolbar/Toolbar'
import WebView from './components/WebView/WebView'
import Sidebar from './components/Sidebar/Sidebar'
import { BrowserProvider } from './context/BrowserContext'
import { BookmarkProvider } from './context/BookmarkContext'
import { HistoryProvider } from './context/HistoryContext' // Import this

function App() {
  return (
    <BrowserProvider>
      <BookmarkProvider>
        <HistoryProvider> {/* Add this here */}
          <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
            <TabBar />
            <Toolbar />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <WebView />
            </div>
          </div>
        </HistoryProvider>
      </BookmarkProvider>
    </BrowserProvider>
  )
}

export default App