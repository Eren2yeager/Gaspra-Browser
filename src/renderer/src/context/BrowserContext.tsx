import { createContext, useContext, useState, ReactNode, useRef } from 'react'

interface Tab {
  id: number
  title: string
  url: string
  isLoading: boolean
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
  const [tabs, setTabs] = useState<Tab[]>([{ id: 1, title: 'New Tab', url: 'https://google.com', isLoading: false }])

  const [activeTabId, setActiveTabId] = useState(1)
  const webviewRefs = useRef<Record<number, Electron.WebviewTag | null>>({})
  const addTab = (url: string = 'https://google.com') => {
    const newTab: Tab = {
      id: Date.now(),
      title: url.startsWith('gaspra://') ? url.replace('gaspra://', '') : 'New Tab',
      url: url
    , isLoading: false 
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
  }

  const closeTab = (id: number) => {
    // remove the tab with this id from tabs
    // if it was the active tab, set the previous tab as active
    const updatedTabs = tabs.filter((tab) => tab.id !== id)
    setTabs(updatedTabs)

    if (updatedTabs.length === 0) {
      window.close()
      return
    }

    if (activeTabId === id) {
      setActiveTabId(updatedTabs[updatedTabs.length - 1].id)
    }
  }

  const setActiveTab = (id: number) => {
    setActiveTabId(id)
  }

  const updateTab = (id: number, changes: Partial<Tab>) => {
    // find the tab with this id and merge changes into it
    setTabs(tabs.map((tab) => (tab.id === id ? { ...tab, ...changes } : tab)))
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
