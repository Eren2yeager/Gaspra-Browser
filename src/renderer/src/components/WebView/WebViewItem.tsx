import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useSettings } from '../../context/SettingsContext'

type WebViewItemProps = {
  tabId: number
  url: string
  isActive: boolean
  onWebviewRef: (tabId: number, el: Electron.WebviewTag | null) => void
}

const WebViewItem = ({ tabId, url, isActive, onWebviewRef }: WebViewItemProps) => {
  const webviewRef = useRef<Electron.WebviewTag | null>(null)
  const [isDomReady, setIsDomReady] = useState(false)
  const lastLoadedUrlRef = useRef<string | null>(null)
  const { settings } = useSettings()

  // Build webpreferences string
  const webPreferences = `javascript=${settings?.enableJavaScript ?? true};images=${settings?.enableImages ?? true}`

  const setRef = useCallback(
    (el: unknown) => {
      const webviewEl = el as Electron.WebviewTag | null
      webviewRef.current = webviewEl
      onWebviewRef(tabId, webviewEl)
      setIsDomReady(false)

      if (webviewEl) {
        const handleDomReady = () => {
          setIsDomReady(true)
        }
        ;(webviewEl as any)._onDomReady = handleDomReady
        webviewEl.addEventListener('dom-ready', handleDomReady)

        // Block popups if setting is enabled
        const handleNewWindow = (e: any) => {
          if (settings?.blockPopups) {
            e.preventDefault()
          }
        }
        ;(webviewEl as any)._onNewWindow = handleNewWindow
        webviewEl.addEventListener('new-window', handleNewWindow)
      }
    },
    [onWebviewRef, tabId, settings?.blockPopups]
  )

  // When URL changes, navigate the webview to the new URL
  useEffect(() => {
    if (webviewRef.current && url && url !== lastLoadedUrlRef.current) {
      if (isDomReady) {
        try {
          const currentUrl = webviewRef.current.getURL()
          if (currentUrl !== url) {
            webviewRef.current.loadURL(url)
            lastLoadedUrlRef.current = url
          }
        } catch (e) {
          // If getURL fails, just try to load URL anyway
          try {
            webviewRef.current.loadURL(url)
            lastLoadedUrlRef.current = url
          } catch (err) {
            // If loadURL also fails, do nothing
          }
        }
      }
    }
  }, [url, isDomReady])

  return (
    <webview
      ref={setRef as any}
      src={url}
      webpreferences={webPreferences}
      style={{
        display: isActive ? 'flex' : 'none',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }}
    />
  )
}

export default memo(
  WebViewItem,
  (prev, next) => prev.url === next.url && prev.isActive === next.isActive
)
