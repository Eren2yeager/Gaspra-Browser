import { useEffect, useRef, type DragEvent } from 'react'
import { useBrowser } from '../../context/BrowserContext'
import { useHistory } from '../../context/HistoryContext'
import HistoryPage from '../InternalPages/HistoryPage'
import DownloadsPage from '../InternalPages/DownloadsPage'
import NewTabPage from '../InternalPages/NewTabPage'
import SettingsPage from '../InternalPages/SettingsPage'
import { extractDroppedUrl, isLinkDrag } from '../../lib/droppedUrl'

const WebView = () => {
  const { tabs, activeTabId, navigateTab } = useBrowser()
  const { addHistory } = useHistory()
  const containerRef = useRef<HTMLDivElement>(null)
  const lastHistoryUrlRef = useRef<Record<number, string>>({})

  // Report content bounds so main can size WebContentsViews over this area
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const report = () => {
      const rect = el.getBoundingClientRect()
      window.browserAPI.setTabViewBounds({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      })
    }

    report()
    const observer = new ResizeObserver(report)
    observer.observe(el)
    window.addEventListener('resize', report)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', report)
    }
  }, [])

  // Record history from webContents did-stop-loading (ported from <webview>)
  useEffect(() => {
    const unsubscribe = window.browserAPI.onTabViewUpdated(({ tabId, changes }) => {
      if (changes.isLoading !== false) return
      const url = typeof changes.url === 'string' ? changes.url : ''
      const title = typeof changes.title === 'string' ? changes.title : ''
      if (!url || url.startsWith('gaspra://')) return
      if (lastHistoryUrlRef.current[tabId] === url) return
      lastHistoryUrlRef.current[tabId] = url
      addHistory(title || url, url)
    })
    return unsubscribe
  }, [addHistory])

  const activeTab = tabs.find((t) => t.id === activeTabId)
  const showInternal = activeTab?.url.startsWith('gaspra://')

  const handleLinkDragOver = (e: DragEvent) => {
    if (!showInternal || !isLinkDrag(e.dataTransfer)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'link'
  }

  const handleLinkDrop = (e: DragEvent) => {
    if (!showInternal || !activeTab) return
    e.preventDefault()
    const url = extractDroppedUrl(e.dataTransfer)
    if (!url) return
    navigateTab(activeTab.id, url)
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 min-w-0 relative overflow-hidden"
      onDragOver={handleLinkDragOver}
      onDrop={handleLinkDrop}
    >
      {showInternal && activeTab?.url === 'gaspra://newtab' && (
        <div className="w-full h-full absolute inset-0 overflow-y-auto bg-background">
          <NewTabPage />
        </div>
      )}
      {showInternal && activeTab?.url === 'gaspra://history' && (
        <div className="w-full h-full absolute inset-0 overflow-y-auto bg-background">
          <HistoryPage />
        </div>
      )}
      {showInternal && activeTab?.url === 'gaspra://downloads' && (
        <div className="w-full h-full absolute inset-0 overflow-y-auto bg-background">
          <DownloadsPage />
        </div>
      )}
      {showInternal && activeTab?.url === 'gaspra://settings' && (
        <div className="w-full h-full absolute inset-0 overflow-y-auto bg-background">
          <SettingsPage />
        </div>
      )}
    </div>
  )
}

export default WebView
