import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react'
import { useSettings } from './SettingsContext'

export interface Tab {
  id: number
  title: string
  url: string
  requestedUrl: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  favicon?: string
}

interface BrowserContextType {
  tabs: Tab[]
  activeTabId: number
  addTab: (url?: string) => void
  closeTab: (id: number) => void
  setActiveTab: (id: number) => void
  updateTab: (id: number, changes: Partial<Tab>) => void
  navigateTab: (id: number, url: string) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
  tearOffTab: (id: number, screenX: number, screenY: number) => Promise<void>
  goBack: (id?: number) => void
  goForward: (id?: number) => void
  reload: (id?: number) => void
  reloadIgnoringCache: (id?: number) => void
  stop: (id?: number) => void
}

const BrowserContext = createContext<BrowserContextType | null>(null)

function isInternalUrl(url: string): boolean {
  return url.startsWith('gaspra://')
}

function makeTab(url: string, id?: number): Tab {
  return {
    id: id ?? Date.now() + Math.random(),
    title: isInternalUrl(url)
      ? url.replace('gaspra://', '').charAt(0).toUpperCase() + url.replace('gaspra://', '').slice(1)
      : 'New Tab',
    url,
    requestedUrl: url,
    isLoading: false,
    canGoBack: false,
    canGoForward: false
  }
}

export function BrowserProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([makeTab('gaspra://newtab', 1)])
  const [activeTabId, setActiveTabId] = useState(1)
  const [ready, setReady] = useState(false)
  const { settings } = useSettings()
  const activeTabIdRef = useRef(activeTabId)
  const tabsRef = useRef(tabs)
  const bootedRef = useRef(false)
  tabsRef.current = tabs

  useEffect(() => {
    activeTabIdRef.current = activeTabId
  }, [activeTabId])

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      if (bootedRef.current) {
        setReady(true)
        return
      }

      const initResult = await window.browserAPI.getTabViewInit()
      if (cancelled) return

      bootedRef.current = true

      if (initResult.success && initResult.init) {
        const loaded: Tab[] = initResult.init.tabs.map((t) => ({
          id: t.id,
          title: t.title,
          url: t.url,
          requestedUrl: t.url,
          isLoading: t.isLoading,
          canGoBack: t.canGoBack,
          canGoForward: t.canGoForward
        }))
        setTabs(loaded)
        setActiveTabId(initResult.init.activeTabId)
        await window.browserAPI.setActiveTabView(initResult.init.activeTabId)
        setReady(true)
        return
      }

      // Tear-off / seeded windows must never restore the global saved tab set.
      if (initResult.success && initResult.skipRestore) {
        await window.browserAPI.setActiveTabView(activeTabIdRef.current)
        setReady(true)
        return
      }

      if (settings?.saveTabsOnClose) {
        const result = await window.browserAPI.getTabs()
        if (!cancelled && result.success && result.tabs && result.tabs.length > 0) {
          const loaded: Tab[] = result.tabs.map((tab: any) => ({
            id: Date.now() + Math.random(),
            title: tab.title,
            url: tab.url,
            requestedUrl: tab.url,
            isLoading: false,
            canGoBack: false,
            canGoForward: false
          }))
          setTabs(loaded)
          const activeTabIndex = result.tabs.findIndex((t: any) => t.isActive)
          const activeId =
            activeTabIndex !== -1 ? loaded[activeTabIndex].id : loaded[0].id
          setActiveTabId(activeId)

          for (const tab of loaded) {
            if (!isInternalUrl(tab.url)) {
              await window.browserAPI.ensureTabView(tab.id, tab.url)
            }
          }
          await window.browserAPI.setActiveTabView(activeId)
          setReady(true)
          return
        }
      }

      await window.browserAPI.setActiveTabView(1)
      setReady(true)
    }

    boot()
    return () => {
      cancelled = true
    }
  }, [settings?.saveTabsOnClose])

  useEffect(() => {
    if (!ready) return
    window.browserAPI.setActiveTabView(activeTabId)
  }, [activeTabId, ready])

  useEffect(() => {
    const unsubscribe = window.browserAPI.onTabViewUpdated(({ tabId, changes }) => {
      setTabs((prev) =>
        prev.map((tab) => (tab.id === tabId ? { ...tab, ...changes } : tab))
      )
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubAttached = window.browserAPI.onTabViewAttached(({ tabId, tab }) => {
      setTabs((prev) => {
        const next: Tab = {
          id: tabId,
          title: tab.title,
          url: tab.url,
          requestedUrl: tab.url,
          isLoading: tab.isLoading,
          canGoBack: tab.canGoBack,
          canGoForward: tab.canGoForward
        }

        const existing = prev.find((t) => t.id === tabId)
        if (existing) {
          return prev.map((t) => (t.id === tabId ? { ...t, ...next } : t))
        }
        return [...prev, next]
      })

      setActiveTabId(tabId)
      window.browserAPI.setActiveTabView(tabId)
    })

    const unsubDetached = window.browserAPI.onTabViewDetached(({ tabId }) => {
      setTabs((prev) => {
        const updatedTabs = prev.filter((t) => t.id !== tabId)
        if (updatedTabs.length === 0) {
          window.browserAPI.closeWindow()
          return updatedTabs
        }

        if (activeTabIdRef.current === tabId) {
          const nextId = updatedTabs[updatedTabs.length - 1].id
          setActiveTabId(nextId)
          window.browserAPI.setActiveTabView(nextId)
        }

        return updatedTabs
      })
    })

    return () => {
      unsubAttached()
      unsubDetached()
    }
  }, [])

  useEffect(() => {
    const unsubscribe = window.browserAPI.onOpenLinkInNewTab((url: string) => {
      addTab(url)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const saveTabsBeforeClose = async () => {
      if (settings?.saveTabsOnClose) {
        const tabsToSave = tabs.map((tab, position) => ({
          id: tab.id.toString(),
          url: tab.url,
          title: tab.title,
          isActive: tab.id === activeTabId,
          position,
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
    if (isInternalUrl(url) && url !== 'gaspra://newtab') {
      const existingTab = tabsRef.current.find((tab) => tab.url === url)
      if (existingTab) {
        setActiveTabId(existingTab.id)
        return
      }
    }

    const newTab = makeTab(url)
    setTabs((prev) => {
      if (settings?.openNewTabPosition === 'after current') {
        const currentIndex = prev.findIndex((tab) => tab.id === activeTabId)
        const next = [...prev]
        next.splice(currentIndex + 1, 0, newTab)
        return next
      }
      return [...prev, newTab]
    })
    setActiveTabId(newTab.id)

    if (!isInternalUrl(url)) {
      window.browserAPI.ensureTabView(newTab.id, url)
    }
    window.browserAPI.setActiveTabView(newTab.id)
  }

  const closeTab = (id: number) => {
    window.browserAPI.destroyTabView(id)

    setTabs((prev) => {
      const updatedTabs = prev.filter((tab) => tab.id !== id)

      if (updatedTabs.length === 0) {
        window.browserAPI.closeWindow()
        return updatedTabs
      }

      if (activeTabId === id) {
        const nextId = updatedTabs[updatedTabs.length - 1].id
        setActiveTabId(nextId)
        window.browserAPI.setActiveTabView(nextId)
      }

      return updatedTabs
    })
  }

  const setActiveTab = (id: number) => {
    setActiveTabId(id)
  }

  const updateTab = (id: number, changes: Partial<Tab>) => {
    setTabs((prev) => prev.map((tab) => (tab.id === id ? { ...tab, ...changes } : tab)))
  }

  const navigateTab = (id: number, url: string) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === id
          ? {
              ...tab,
              url,
              requestedUrl: url,
              title: isInternalUrl(url)
                ? url.replace('gaspra://', '').charAt(0).toUpperCase() +
                  url.replace('gaspra://', '').slice(1)
                : tab.title,
              favicon: isInternalUrl(url) ? undefined : tab.favicon
            }
          : tab
      )
    )
    window.browserAPI.navigateTabView(id, url)
    if (id === activeTabId) {
      window.browserAPI.setActiveTabView(id)
    }
  }

  // Same-window reorder: UI state only — never touch WebContentsViews
  const reorderTabs = (fromIndex: number, toIndex: number) => {
    setTabs((prev) => {
      const newTabs = [...prev]
      const [movedTab] = newTabs.splice(fromIndex, 1)
      newTabs.splice(toIndex, 0, movedTab)
      return newTabs
    })
  }

  const tearOffTab = async (id: number, screenX: number, screenY: number) => {
    const tab = tabsRef.current.find((t) => t.id === id)
    if (!tab) return

    await window.browserAPI.tearOffTabView({
      tabId: id,
      tab: {
        id: tab.id,
        title: tab.title,
        url: tab.url,
        isLoading: tab.isLoading,
        canGoBack: tab.canGoBack,
        canGoForward: tab.canGoForward
      },
      screenX,
      screenY
    })
    // Source/target UI updates come from tab-view-detached / tab-view-attached events.
  }

  const goBack = (id: number = activeTabId) => {
    window.browserAPI.goBackTabView(id)
  }

  const goForward = (id: number = activeTabId) => {
    window.browserAPI.goForwardTabView(id)
  }

  const reload = (id: number = activeTabId) => {
    window.browserAPI.reloadTabView(id)
  }

  const reloadIgnoringCache = (id: number = activeTabId) => {
    window.browserAPI.reloadTabViewIgnoringCache(id)
  }

  const stop = (id: number = activeTabId) => {
    window.browserAPI.stopTabView(id)
  }

  return (
    <BrowserContext.Provider
      value={{
        tabs,
        activeTabId,
        addTab,
        closeTab,
        setActiveTab,
        updateTab,
        navigateTab,
        reorderTabs,
        tearOffTab,
        goBack,
        goForward,
        reload,
        reloadIgnoringCache,
        stop
      }}
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
