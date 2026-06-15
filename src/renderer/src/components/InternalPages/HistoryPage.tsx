import { useState, useMemo } from 'react'
import { useHistory } from '../../context/HistoryContext'
import { useBrowser } from '../../context/BrowserContext'
import { Clock, Trash2, Search, Globe, X, CheckSquare, Square } from 'lucide-react'
import {AppIcon} from '../CustomIcons/AppIcon'

export default function HistoryPage() {
  const { groupedHistory, clearHistory, deleteHistoryItem } = useHistory()
  const { activeTabId, updateTab, webviewRefs, tabs, setActiveTab } = useBrowser()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)

  // Filter grouped history
  const filteredGroupedHistory = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedHistory
    }
    
    const query = searchQuery.toLowerCase()
    const result: Record<string, any[]> = {}
    
    for (const date in groupedHistory) {
      const filteredItems = groupedHistory[date].filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.url.toLowerCase().includes(query)
      )
      if (filteredItems.length > 0) {
        result[date] = filteredItems
      }
    }
    
    return result
  }, [groupedHistory, searchQuery])

  const handleNavigate = (url: string) => {
    if (isSelectMode) return
    if (!activeTabId) return

    // Check if it's an internal page (gaspra://) and not newtab
    if (url.startsWith('gaspra://') && url !== 'gaspra://newtab') {
      // Find existing tab with this URL
      const existingTab = tabs.find(tab => tab.url === url)
      if (existingTab) {
        // Activate the existing tab instead of updating current
        setActiveTab(existingTab.id)
        return
      }
    }

    updateTab(activeTabId, { url, requestedUrl: url, title: url })
    const webview = webviewRefs.current[activeTabId]
    if (webview) webview.loadURL(url)
  }

  const formatDateGroup = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleDeleteItem = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    deleteHistoryItem(id)
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  const toggleSelectItem = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectDateGroup = (items: any[]) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      const allSelected = items.every(item => newSet.has(item.id))
      
      if (allSelected) {
        items.forEach(item => newSet.delete(item.id))
      } else {
        items.forEach(item => newSet.add(item.id))
      }
      
      return newSet
    })
  }

  const selectAll = () => {
    const allIds: number[] = []
    for (const date in filteredGroupedHistory) {
      filteredGroupedHistory[date].forEach((item: any) => allIds.push(item.id))
    }
    setSelectedItems(new Set(allIds))
  }

  const deselectAll = () => {
    setSelectedItems(new Set())
  }

  const deleteSelected = async () => {
    if (confirm(`Delete ${selectedItems.size} selected items?`)) {
      for (const id of selectedItems) {
        await deleteHistoryItem(id)
      }
      setSelectedItems(new Set())
      setIsSelectMode(false)
    }
  }

  const deleteDateGroup = (e: React.MouseEvent, items: any[]) => {
    e.stopPropagation()
    if (confirm(`Delete ${items.length} items from this date?`)) {
      items.forEach(item => deleteHistoryItem(item.id))
    }
  }

  const sortedDates = Object.keys(filteredGroupedHistory).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  const hasHistory = sortedDates.length > 0

  return (
    <div className="w-full h-full flex flex-col p-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <AppIcon size={50} className="text-muted-foreground pt-0.5" />
            History
          </h1>
          {isSelectMode && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedItems.size} selected
              </span>
              <button
                onClick={deselectAll}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Deselect all
              </button>
              <button
                onClick={deleteSelected}
                disabled={selectedItems.size === 0}
                className="
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                  bg-destructive/70 hover:bg-destructive
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                <Trash2 size={14} />
                Delete selected
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isSelectMode && hasHistory && (
            <>
              <button
                onClick={() => {
                  setIsSelectMode(true)
                  selectAll()
                }}
                className="
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                  bg-accent text-accent-foreground hover:bg-accent/80
                  transition-colors
                "
              >
                <CheckSquare size={14} />
                Select
              </button>
              <button
                onClick={clearHistory}
                className="
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                  bg-destructive/70 hover:bg-destructive
                  transition-colors
                "
              >
                <Trash2 size={14} />
                Clear History
              </button>
            </>
          )}
          {isSelectMode && (
            <button
              onClick={() => {
                setIsSelectMode(false)
                deselectAll()
              }}
              className="
                px-3 py-1.5 rounded-md text-sm font-medium
                bg-accent text-accent-foreground hover:bg-accent/80
                transition-colors
              "
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="
            w-full pl-9 pr-4 py-2 text-sm rounded-full
                border border-input bg-muted
                focus:outline-none focus:ring-2 focus:ring-ring
                placeholder:text-muted-foreground 
            transition-all
          "
        />
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        {!hasHistory ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
            <Clock size={32} className="mb-3 opacity-20" />
            <p>{searchQuery ? 'No history matches your search.' : 'No history yet.'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => {
              const items = filteredGroupedHistory[date]
              const allSelectedForDate = items.every(item => selectedItems.has(item.id))

              return (
                <div key={date}>
                  {/* Date Header with Group Select/Delete */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h2 
                      className="text-sm font-semibold text-muted-foreground cursor-pointer flex items-center gap-2"
                      onClick={() => toggleSelectDateGroup(items)}
                    >
                      {isSelectMode && (
                        <button className="text-muted-foreground hover:text-foreground">
                          {allSelectedForDate ? <CheckSquare size={14} /> : <Square size={14} />}
                        </button>
                      )}
                      {formatDateGroup(date)}
                    </h2>
                    {isSelectMode && (
                      <button
                        onClick={(e) => deleteDateGroup(e, items)}
                        className="
                          text-xs px-2 py-1 rounded-md
                          bg-destructive/70 hover:bg-destructive
                          transition-colors
                        "
                      >
                        Delete all
                      </button>
                    )}
                  </div>
                  
                  {/* Items for this date */}
                  <ul className="space-y-0.5">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        onClick={() => handleNavigate(item.url)}
                        className={`
                          group flex items-center gap-3 px-4 py-3 rounded-md
                          transition-colors
                          ${isSelectMode 
                            ? 'cursor-pointer' 
                            : 'hover:bg-accent hover:text-accent-foreground'
                          }
                          ${selectedItems.has(item.id) 
                            ? 'bg-accent' 
                            : ''
                          }
                        `}
                      >
                        {/* Checkbox for select mode */}
                        {isSelectMode && (
                          <button
                            onClick={(e) => toggleSelectItem(e, item.id)}
                            className="text-muted-foreground hover:text-foreground flex-shrink-0"
                          >
                            {selectedItems.has(item.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        )}

                        {/* Favicon */}
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=32`}
                          alt=""
                          width={16}
                          height={16}
                          className="w-4 h-4 flex-shrink-0 rounded-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                        <Globe size={14} className="hidden text-muted-foreground flex-shrink-0" />

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.url.replace(/^https?:\/\//, '')}
                          </div>
                        </div>

                        {/* Time and Delete Button */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(item.visited_at)}
                          </span>
                          <button
                            onClick={(e) => handleDeleteItem(e, item.id)}
                            className={`
                              p-1.5 rounded-md
                              transition-all
                              ${isSelectMode 
                                ? 'opacity-100' 
                                : 'opacity-0 group-hover:opacity-100'
                              }
                              hover:bg-destructive
                            `}
                            title="Remove from history"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}