import { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react'
import { useSettings } from './SettingsContext'

interface Tab {
  id: number
  title: string
  url: string
  requestedUrl: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
}
interface BrowserContextType {
  tabs: Tab[]
  activeTabId: number
  addTab: (url?: string) => void
  closeTab: (id: number) => void
  setActiveTab: (id: number) => void
  updateTab: (id: number, changes: Partial<Tab>) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
  webviewRefs: React.MutableRefObject<Record<number, Electron.WebviewTag | null>>
}

const BrowserContext = createContext<BrowserContextType | null>(null)

export function BrowserProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: 1,
      title: 'New Tab',
      url: 'gaspra://newtab',
      requestedUrl: 'gaspra://newtab',
      isLoading: false,
      canGoBack: false,
      canGoForward: false
    }
  ])

  const [activeTabId, setActiveTabId] = useState(1)
  const webviewRefs = useRef<Record<number, Electron.WebviewTag | null>>({})
  const { settings } = useSettings()

  // Load saved tabs on startup
  useEffect(() => {
    const loadSavedTabs = async () => {
      if (settings?.saveTabsOnClose) {
        const result = await window.browserAPI.getTabs()
        if (result.success && result.tabs && result.tabs.length > 0) {
          const loadedTabs: Tab[] = result.tabs.map((tab: any) => ({
            id: Date.now() + Math.random(),
            title: tab.title,
            url: tab.url,
            requestedUrl: tab.url,
            isLoading: false,
            canGoBack: false,
            canGoForward: false
          }))
          setTabs(loadedTabs)
          const activeTabIndex = result.tabs.findIndex((t: any) => t.isActive)
          if (activeTabIndex !== -1) {
            setActiveTabId(loadedTabs[activeTabIndex].id)
          }
        }
      }
    }
    loadSavedTabs()
  }, [settings?.saveTabsOnClose])

  // Handle open link in new tab from context menu
  useEffect(() => {
    const unsubscribe = window.browserAPI.onOpenLinkInNewTab((url: string) => {
      addTab(url)
    })
    return unsubscribe
  }, [])

  // Save tabs on unload
  useEffect(() => {
    const saveTabsBeforeClose = async () => {
      if (settings?.saveTabsOnClose) {
        const tabsToSave = tabs.map(tab => ({
          id: tab.id.toString(),
          url: tab.url,
          title: tab.title,
          isActive: tab.id === activeTabId,
          position: tabs.indexOf(tab),
          createdAt: new Date().toISOString()
        }))
        await window.browserAPI.saveTabs(tabsToSave)
      }
    }

    window.addEventListener('beforeunload', saveTabsBeforeClose)
    return () => {
      window.removeEventListener('beforeunload', saveTabsBeforeClose)
      saveTabsBeforeClose()
    }
  }, [tabs, activeTabId, settings?.saveTabsOnClose])

  const addTab = (url: string = 'gaspra://newtab') => {
    // Check if it's an internal page (gaspra://) and not newtab
    if (url.startsWith('gaspra://') && url !== 'gaspra://newtab') {
      // Find existing tab with this URL
      const existingTab = tabs.find(tab => tab.url === url)
      if (existingTab) {
        // Activate the existing tab instead of creating new
        setActiveTabId(existingTab.id)
        return
      }
    }

    // If no existing tab found, create a new one
    const newTab: Tab = {
      id: Date.now(),
      title: url.startsWith('gaspra://') 
        ? url.replace('gaspra://', '').charAt(0).toUpperCase() + url.replace('gaspra://', '').slice(1) 
        : 'New Tab',
      url: url,
      requestedUrl: url,
      isLoading: false,
      canGoBack: false,
      canGoForward: false
    }

    if (settings?.openNewTabPosition === 'after current') {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTabId)
      const newTabs = [...tabs]
      newTabs.splice(currentIndex + 1, 0, newTab)
      setTabs(newTabs)
    } else {
      setTabs((prev) => [...prev, newTab])
    }

    setActiveTabId(newTab.id)
  }

  const closeTab = (id: number) => {
    // remove the tab with this id from tabs
    // if it was the active tab, set the previous tab as active
    setTabs((prev) => {
      const updatedTabs = prev.filter((tab) => tab.id !== id)

      if (updatedTabs.length === 0) {
        window.close()
        return updatedTabs
      }

      if (activeTabId === id) {
        setActiveTabId(updatedTabs[updatedTabs.length - 1].id)
      }

      return updatedTabs
    })
  }

  const setActiveTab = (id: number) => {
    setActiveTabId(id)
  }

  const updateTab = (id: number, changes: Partial<Tab>) => {
    // find the tab with this id and merge changes into it
    setTabs((prev) => prev.map((tab) => (tab.id === id ? { ...tab, ...changes } : tab)))
  }

  const reorderTabs = (fromIndex: number, toIndex: number) => {
    setTabs((prev) => {
      const newTabs = [...prev]
      const [movedTab] = newTabs.splice(fromIndex, 1)
      newTabs.splice(toIndex, 0, movedTab)
      return newTabs
    })
  }

  return (
    <BrowserContext.Provider
      value={{ tabs, activeTabId, addTab, closeTab, setActiveTab, updateTab, reorderTabs, webviewRefs }}
    >
      {children}
    </BrowserContext.Provider>
  )
}

export function useBrowser() {
  const context = useContext(BrowserContext)
  if (!context) throw new Error('useBrowser must be used within BrowserProvider')
  return context
}
