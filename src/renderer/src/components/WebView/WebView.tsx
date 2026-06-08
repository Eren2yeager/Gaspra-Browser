import { useCallback, useEffect, useRef } from 'react'
import { useBrowser } from '../../context/BrowserContext'
import { useHistory } from '../../context/HistoryContext'
import HistoryPage from '../InternalPages/HistoryPage'
import DownloadsPage from '../InternalPages/DownloadsPage'
import NewTabPage from '../InternalPages/NewTabPage'
import SettingsPage from '../InternalPages/SettingsPage'
import WebViewItem from './WebViewItem'

const WebView = () => {
  const { tabs, activeTabId, updateTab, webviewRefs } = useBrowser()
  const { addHistory } = useHistory()

  const updateTabRef = useRef(updateTab)
  const addHistoryRef = useRef(addHistory)
  const attachedRef = useRef<Record<number, boolean>>({})
  const lastRecordedHistoryUrlRef = useRef<Record<number, string>>({})

  updateTabRef.current = updateTab
  addHistoryRef.current = addHistory

  const handleWebviewRef = useCallback(
    (tabId: number, el: Electron.WebviewTag | null) => {
      webviewRefs.current[tabId] = el
    },
    [webviewRefs]
  )

useEffect(() => {
  // Cleanup function to remove event listeners for closed tabs
  const cleanup = () => {
    Object.keys(attachedRef.current).forEach((key) => {
      const tabId = Number(key)
      const tabStillExists = tabs.some((t) => t.id === tabId)
      if (!tabStillExists) {
        delete attachedRef.current[tabId]
        delete lastRecordedHistoryUrlRef.current[tabId]
      }
    })
  }

  tabs.forEach((tab) => {
    const webview = webviewRefs.current[tab.id]
    if (!webview) return
    if (attachedRef.current[tab.id]) return

    const attachEvents = () => {
      const getNavState = () => {
        try {
          return { canGoBack: webview.canGoBack(), canGoForward: webview.canGoForward() }
        } catch {
          return { canGoBack: false, canGoForward: false }
        }
      }

      const syncNavState = (url?: string) => {
        const nav = getNavState()
        updateTabRef.current(tab.id, {
          ...(url ? { url } : {}),
          canGoBack: nav.canGoBack,
          canGoForward: nav.canGoForward
        })
      }

      const handleTitleUpdate = (e: any) => {
        updateTabRef.current(tab.id, { title: e.title })
      }

      const handleNavigate = (e: any) => {
        syncNavState(e.url)
      }

      const handleNavigateInPage = (e: any) => {
        if (e?.isMainFrame && e?.url) {
          syncNavState(e.url)
        } else {
          syncNavState()
        }
      }

      const handleStartLoading = () => updateTabRef.current(tab.id, { isLoading: true })
      const handleStopLoading = () => {
        updateTabRef.current(tab.id, { isLoading: false })
        syncNavState()

        let url = ''
        let title = ''

        try {
          url = webview.getURL()
        } catch {
          url = ''
        }

        try {
          title = webview.getTitle()
        } catch {
          title = ''
        }

        if (!url || url.startsWith('gaspra://')) return

        const lastRecordedUrl = lastRecordedHistoryUrlRef.current[tab.id]
        if (lastRecordedUrl === url) return

        lastRecordedHistoryUrlRef.current[tab.id] = url
        addHistoryRef.current(title || url, url)
      }

      // Store handlers on webview so we can remove them later
      ;(webview as any)._handlers = {
        handleTitleUpdate,
        handleNavigate,
        handleNavigateInPage,
        handleStartLoading,
        handleStopLoading
      }

      webview.addEventListener('page-title-updated', handleTitleUpdate)
      webview.addEventListener('did-navigate', handleNavigate)
      webview.addEventListener('did-navigate-in-page', handleNavigateInPage)
      webview.addEventListener('did-start-loading', handleStartLoading)
      webview.addEventListener('did-stop-loading', handleStopLoading)

      attachedRef.current[tab.id] = true
    }

    const onceAttach = () => {
      webview.removeEventListener('dom-ready', onceAttach)
      attachEvents()
    }

    let isDomReady = false
    try {
      webview.getWebContentsId()
      isDomReady = true
    } catch {
      isDomReady = false
    }

    if (isDomReady) {
      attachEvents()
    } else {
      webview.addEventListener('dom-ready', onceAttach)
    }
  })

  cleanup()
}, [tabs])
  return (
    <div className="flex-1 min-w-0 relative overflow-hidden">
      {tabs.map((tab) => {
        if (tab.url === 'gaspra://newtab') {
          return (
            <div
              key={tab.id}
              style={{ display: tab.id === activeTabId ? 'flex' : 'none' }}
              className="w-full h-full absolute top-0 left-0 overflow-y-auto bg-background"
            >
              <NewTabPage />
            </div>
          )
        }

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

        if (tab.url === 'gaspra://downloads') {
          return (
            <div
              key={tab.id}
              style={{ display: tab.id === activeTabId ? 'flex' : 'none' }}
              className="w-full h-full absolute top-0 left-0 overflow-y-auto bg-background"
            >
              <DownloadsPage />
            </div>
          )
        }

        if (tab.url === 'gaspra://settings') {
          return (
            <div
              key={tab.id}
              style={{ display: tab.id === activeTabId ? 'flex' : 'none' }}
              className="w-full h-full absolute top-0 left-0 overflow-y-auto bg-background"
            >
              <SettingsPage />
            </div>
          )
        }

        return (
          <WebViewItem
            key={tab.id}
            tabId={tab.id}
            url={tab.requestedUrl}
            isActive={tab.id === activeTabId}
            onWebviewRef={handleWebviewRef}
          />
        )
      })}
    </div>
  )
}

export default WebView
