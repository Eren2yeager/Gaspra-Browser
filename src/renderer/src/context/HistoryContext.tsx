import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface HistoryItem {
  id: number
  title: string
  url: string
  visited_at: string
}

interface HistoryContextType {
  history: HistoryItem[]
  addHistory: (title: string, url: string) => Promise<void>
  clearHistory: () => Promise<void>
  refreshHistory: () => Promise<void>
}

const HistoryContext = createContext<HistoryContextType | null>(null)

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([])

  const refreshHistory = async () => {
    try {
      const response = await window.browserAPI.getHistory()
      if (response.success) {
        setHistory(response.history as HistoryItem[] ?? [])
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  const addHistory = async (title: string, url: string) => {
    try {
      const response = await window.browserAPI.addHistory(title, url)
      if (response.success) {
        await refreshHistory()
      }
    } catch (error) {
      console.error('Error adding history:', error)
    }
  }

  const clearHistory = async () => {
    try {
      const response = await window.browserAPI.clearHistory()
      if (response.success) {
        setHistory([])
      }
    } catch (error) {
      console.error('Error clearing history:', error)
    }
  }

  useEffect(() => {
    refreshHistory()
  }, [])

  return (
    <HistoryContext.Provider value={{ history, addHistory, clearHistory, refreshHistory }}>
      {children}
    </HistoryContext.Provider>
  )
}

export function useHistory() {
  const context = useContext(HistoryContext)
  if (!context) throw new Error('useHistory must be used within a HistoryProvider')
  return context
}