import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSettings } from './SettingsContext'

type SearchHistoryItem = {
  id: number
  query: string
  last_searched_at: string
  search_count: number
}

interface SearchHistoryContextType {
  searchHistory: SearchHistoryItem[]
  addSearch: (query: string) => Promise<void>
  getSearchHistory: (limit?: number) => Promise<void>
  clearSearchHistory: () => Promise<void>
  deleteSearch: (id: number) => Promise<void>
}

const SearchHistoryContext = createContext<SearchHistoryContextType | null>(null)

export function SearchHistoryProvider({ children }: { children: ReactNode }) {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const { settings } = useSettings()

  const addSearch = async (query: string) => {
    if (!settings?.saveSearchHistory) return // Don't save if setting is disabled
    await window.browserAPI.addSearch(query)
    await getSearchHistory()
  }

  const getSearchHistory = async (limit?: number) => {
    const result = await window.browserAPI.getSearchHistory(limit)
    if (result.success && result.searchHistory) {
      setSearchHistory(result.searchHistory)
    }
  }

  const clearSearchHistory = async () => {
    await window.browserAPI.clearSearchHistory()
    setSearchHistory([])
  }

  const deleteSearch = async (id: number) => {
    await window.browserAPI.deleteSearch(id)
    setSearchHistory(prev => prev.filter(item => item.id !== id))
  }

  useEffect(() => {
    getSearchHistory()
  }, [])

  return (
    <SearchHistoryContext.Provider
      value={{ searchHistory, addSearch, getSearchHistory, clearSearchHistory, deleteSearch }}
    >
      {children}
    </SearchHistoryContext.Provider>
  )
}

export function useSearchHistory() {
  const context = useContext(SearchHistoryContext)
  if (!context) throw new Error('useSearchHistory must be used within SearchHistoryProvider')
  return context
}
