import { useEffect } from 'react'
import { useBrowser } from '../../context/BrowserContext'
import { useHistory } from '../../context/HistoryContext'
import HistoryPage from './HistoryPage'

const WebView = () => {
  const { tabs, activeTabId, updateTab, webviewRefs } = useBrowser()
  const { addHistory } = useHistory()

  useEffect(() => {
    tabs.forEach((tab) => {
      const webview = webviewRefs.current[tab.id]
      if (!webview) return

      const handleTitleUpdate = (e: any) => {
        updateTab(tab.id, { title: e.title })
      }

      const handleNavigate = (e: any) => {
        updateTab(tab.id, { url: e.url })
        // record history, skip internal pages
        if (!e.url.startsWith('gaspra://')) {
          addHistory(tab.title || e.url, e.url)
        }
      }

      const handleStartLoading = () => updateTab(tab.id, { isLoading: true })
      const handleStopLoading = () => updateTab(tab.id, { isLoading: false })

      webview.addEventListener('page-title-updated', handleTitleUpdate)
      webview.addEventListener('did-navigate', handleNavigate)
      webview.addEventListener('did-start-loading', handleStartLoading)
      webview.addEventListener('did-stop-loading', handleStopLoading)

      return () => {
        webview.removeEventListener('page-title-updated', handleTitleUpdate)
        webview.removeEventListener('did-navigate', handleNavigate)
        webview.removeEventListener('did-start-loading', handleStartLoading)
        webview.removeEventListener('did-stop-loading', handleStopLoading)
      }
    })
  }, [tabs])

  return (
    <div className="flex-1 min-w-0 relative overflow-hidden">
      {tabs.map((tab) => {
        // internal pages — render React component instead of webview
        if (tab.url === 'gaspra://history') {
          return (
            <div
              key={tab.id}
              style={{ display: tab.id === activeTabId ? 'flex' : 'none' }}
              className="w-full h-full absolute top-0 left-0 overflow-y-auto bg-background"
            >
              <HistoryPage />
            </div>
          )
        }

        return (
          <webview
            key={tab.id}
            src={tab.url}
            ref={(el) => {
              webviewRefs.current[tab.id] = el as Electron.WebviewTag
            }}
            style={{
              display: tab.id === activeTabId ? 'flex' : 'none',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />
        )
      })}
    </div>
  )
}

export default WebView
