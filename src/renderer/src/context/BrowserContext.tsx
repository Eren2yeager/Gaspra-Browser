import { createContext, useContext, useState, ReactNode, useRef } from 'react'

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
  const addTab = (url: string = 'gaspra://newtab') => {
    const newTab: Tab = {
      id: Date.now(),
      title: url.startsWith('gaspra://') 
        ? url.replace('gaspra://', '').charAt(0).toUpperCase() + url.replace('gaspra://', '').slice(1) 
        : 'New Tab',
      url: url,
      requestedUrl: url
    , isLoading: false 
    , canGoBack: false
    , canGoForward: false
    }
    setTabs((prev) => [...prev, newTab])
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

  return (
    <BrowserContext.Provider
      value={{ tabs, activeTabId, addTab, closeTab, setActiveTab, updateTab, webviewRefs }}
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
