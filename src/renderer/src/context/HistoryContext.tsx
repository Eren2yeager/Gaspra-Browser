import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useSettings } from './SettingsContext'

interface HistoryItem {
  id: number
  title: string
  url: string
  visited_at: string
}

interface HistoryContextType {
  history: HistoryItem[]
  groupedHistory: Record<string, HistoryItem[]>
  addHistory: (title: string, url: string) => Promise<void>
  clearHistory: () => Promise<void>
  refreshHistory: () => Promise<void>
  deleteHistoryItem: (id: number) => Promise<void>
  searchHistory: (query: string) => Promise<HistoryItem[]>
}

// Helper function to group history by date
const groupHistoryByDate = (history: HistoryItem[]): Record<string, HistoryItem[]> => {
  const grouped: Record<string, HistoryItem[]> = {}
  history.forEach(item => {
    const date = new Date(item.visited_at).toDateString()
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(item)
  })
  return grouped
}

const HistoryContext = createContext<HistoryContextType | null>(null)

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [groupedHistory, setGroupedHistory] = useState<Record<string, HistoryItem[]>>({})
  const { settings } = useSettings()

  const updateHistoryAndGrouped = useCallback((newHistory: HistoryItem[] | ((prev: HistoryItem[]) => HistoryItem[])) => {
    setHistory((prev) => {
      const updatedHistory = typeof newHistory === 'function' 
        ? newHistory(prev) 
        : newHistory
      setGroupedHistory(groupHistoryByDate(updatedHistory))
      return updatedHistory
    })
  }, [])

  const refreshHistory = async () => {
    try {
      const response = await window.browserAPI.getHistory()
      if (response.success) {
        const fetchedHistory = response.history as HistoryItem[] ?? []
        updateHistoryAndGrouped(fetchedHistory)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  const addHistory = async (title: string, url: string) => {
    if (!settings?.saveHistory) return // Don't save if setting is disabled
    try {
      // First add to DB
      const response = await window.browserAPI.addHistory(title, url)
      if (response.success) {
        // Then refresh to get the updated state (since we don't have the new item's id from the response)
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
        updateHistoryAndGrouped([])
      }
    } catch (error) {
      console.error('Error clearing history:', error)
    }
  }

  const deleteHistoryItem = async (id: number) => {
    try {
      await window.browserAPI.deleteHistoryItem(id)
      // Update locally immediately
      updateHistoryAndGrouped((prev) => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting history item:', error)
    }
  }

  const searchHistory = async (query: string): Promise<HistoryItem[]> => {
    if (!query.trim()) return []
    try {
      const response = await window.browserAPI.searchHistory(query)
      if (response.success) {
        return response.results as HistoryItem[] ?? []
      }
      return []
    } catch (error) {
      console.error('Error searching history:', error)
      return []
    }
  }

  useEffect(() => {
    refreshHistory()
  }, [])

  return (
    <HistoryContext.Provider value={{ 
      history, 
      groupedHistory, 
      addHistory, 
      clearHistory, 
      refreshHistory, 
      deleteHistoryItem,
      searchHistory
    }}>
      {children}
    </HistoryContext.Provider>
  )
}

export function useHistory() {
  const context = useContext(HistoryContext)
  if (!context) throw new Error('useHistory must be used within a HistoryProvider')
  return context
}