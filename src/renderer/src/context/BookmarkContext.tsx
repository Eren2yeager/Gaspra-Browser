import { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react'

interface Bookmark {
  id: number
  title: string
  url: string
  created_at: string
}

interface BookmarkContextType {
  bookmarks: Bookmark[]
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  addBookmark: (title: string, url: string) => Promise<void>
  deleteBookmark: (id: number) => Promise<void>
  refreshBookmarks: () => Promise<void>
}

const BookmarkContext = createContext<BookmarkContextType | null>(null)

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)


  useEffect(() => {
    refreshBookmarks()
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const addBookmark = async (title: string, url: string) => {
    try {
      const response = await window.browserAPI.addBookmark(title, url)
      if (response.success) {
        await refreshBookmarks()
      }
    } catch (error) {
      console.error('Error adding bookmark:', error)
    }
  }

  const deleteBookmark = async (id: number) => {
    try {
      const response = await window.browserAPI.deleteBookmark(id)
      if (response.success) {
        await refreshBookmarks()
      }
    } catch (error) {
      console.error('Error deleting bookmark:', error)
    }
  }

  const refreshBookmarks = async () => {
    try {
      const response = await window.browserAPI.getBookmarks()
      if (response.success) {
        setBookmarks(response.bookmarks ?? [])
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
    }
  }

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        addBookmark,
        deleteBookmark,
        refreshBookmarks
      }}
    >
      {children}
    </BookmarkContext.Provider>
  )
}

export const useBookmark = () => {
  const context = useContext(BookmarkContext)
  if (!context) {
    throw new Error('useBookmark must be used within a BookmarkProvider')
  }
  return context
}
