import { useState, MouseEvent, JSX } from 'react'
import { useBookmark } from '../../context/BookmarkContext'
import { useBrowser } from '../../context/BrowserContext'
import { X, Search, Star, Globe, Trash2 } from 'lucide-react'

interface Bookmark {
  id: number
  title: string
  url: string
  created_at: string
}

export default function Sidebar () : JSX.Element {
  const { isSidebarOpen, bookmarks, deleteBookmark, addBookmark, setIsSidebarOpen } = useBookmark()

  const { activeTabId, tabs, updateTab } = useBrowser()

  // Local state for filtering bookmarks
  const [searchQuery, setSearchQuery] = useState('')

  const activeTab = tabs.find((tab) => tab.id === activeTabId)

  // Filter bookmarks based on search query
  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNavigate = (url: string) : void   => {
    if (!activeTabId) return

    // Update the active tab's state (updates the address bar)
    updateTab(activeTabId, { url, requestedUrl: url, title: url })
  }

  const handleAddCurrentPage = () : void => {
    if (activeTab) {
      addBookmark(activeTab.title || activeTab.url, activeTab.url)
    }
  }

  const handleDelete = (event: MouseEvent<HTMLButtonElement>, id: number) : void => {
    event.stopPropagation() // Prevent triggering the li onClick
    deleteBookmark(id)
  }

  const handleClose = () : void =>  {
    setIsSidebarOpen(false)
  }

  return (
    <aside
      className={`
        h-full bg-background flex flex-col 
        transition-all duration-300 ease-in-out overflow-hidden 
        ${isSidebarOpen ? 'w-80' : 'w-0'}
      `}
    >
      {/* 
        min-w-[20rem] prevents text squishing during the width transition animation 
      */}
      <div className="flex-1 flex flex-col min-w-[20rem] bg-muted/20 p-3  rounded-lg">
        {/* 1. Header with Title and Close Button */}
        <div className="flex items-center justify-between ">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Globe size={16} className="text-muted-foreground" />
            Bookmarks
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* 2. Action Bar: Search and Add Button */}
        <div className="py-3">
          {/* Search Input */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-8 pr-3 py-1.5 text-sm rounded-full
                border border-input bg-muted
                focus:outline-none focus:ring-2 focus:ring-ring
                placeholder:text-muted-foreground
                transition-all
              "
            />
          </div>
        </div>

        {/* 3. Scrollable Bookmark List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm px-4 text-center">
              <Globe size={32} className="mb-3 opacity-20" />
              <p>{searchQuery ? 'No bookmarks match your search.' : 'No bookmarks yet.'}</p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {filteredBookmarks.map((bookmark: Bookmark) => (
                <li
                  key={bookmark.id}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-md 
                             hover:bg-accent hover:text-accent-foreground 
                             cursor-pointer transition-colors duration-200"
                  onClick={() => handleNavigate(bookmark.url)}
                >
                  {/* Favicon / Icon */}
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=32`}
                    alt=""
                    className="w-4 h-4 flex-shrink-0 rounded-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <Globe size={14} className="hidden text-muted-foreground flex-shrink-0" />

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-foreground group-hover:text-accent-foreground">
                      {bookmark.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {bookmark.url.replace(/^https?:\/\//, '')}
                    </div>
                  </div>

                  {/* Delete Button (Shows on Hover) */}
                  <button
                    type="button"
                    className="
                      opacity-0 group-hover:opacity-100 
                      p-1.5 rounded-md 
                      hover:bg-destructive/10 hover:text-destructive 
                      transition-all duration-200 flex-shrink-0
                    "
                    onClick={(event) => handleDelete(event, bookmark.id)}
                    aria-label="Delete bookmark"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Add Current Page Button */}
        <button
          onClick={handleAddCurrentPage}
          disabled={!activeTab}
            className="
              flex items-center justify-center gap-2 w-full px-4 py-3 mb-3 rounded-full text-sm bg-muted text-foreground font-medium hover:bg-muted active:scale-95
              hover:text-primary hover:bg-primary/10 transition-all
            "
        >
          <Star size={14} fill="currentColor" />
          Add Current Page
        </button>
      </div>
    </aside>
  )
}
