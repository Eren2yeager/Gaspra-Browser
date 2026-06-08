import React, { useState, useEffect, useRef } from 'react'
import { useBrowser } from '../../context/BrowserContext'
import { useBookmark } from '../../context/BookmarkContext'
import { useSearchHistory } from '../../context/SearchHistoryContext'
import { useSettings } from '../../context/SettingsContext'
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  X,
  Search,
  Lock,
  Star,
  Bookmark,
  History,
  Home,
  Clock,
  Settings as SettingsIcon
} from 'lucide-react'
import DownloadBubble from '../DownloadBubble/DownloadBubble'

// Helper to get search URL from search engine
function getSearchUrl(searchEngine: string, query: string): string {
  switch (searchEngine) {
    case 'google':
      return `https://www.google.com/search?q=${encodeURIComponent(query)}`
    case 'bing':
      return `https://www.bing.com/search?q=${encodeURIComponent(query)}`
    case 'duckduckgo':
      return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
    case 'yahoo':
      return `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(query)}`
  }
}

const Toolbar = () => {
  const { addTab, tabs, activeTabId, updateTab, webviewRefs } = useBrowser()
  const { bookmarks, addBookmark, deleteBookmark, toggleSidebar } = useBookmark()
  const { searchHistory, addSearch, deleteSearch } = useSearchHistory()
  const { settings } = useSettings()

  const activeTab = tabs.find((tab) => tab.id === activeTabId)

  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync local input value with active tab URL, empty on newtab
  useEffect(() => {
    if (activeTab) {
      if (activeTab.url === 'gaspra://newtab') {
        setInputValue('')
      } else {
        setInputValue(activeTab.url)
      }
    }
  }, [activeTab?.id, activeTab?.url])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
      setShowDropdown(true)
    }
  }, [isEditing])

  // Close dropdown when input loses focus (and click is not on dropdown)
  const handleInputBlur = () => {
    // Use setTimeout to check if focus moved to dropdown before closing
    setTimeout(() => {
      const isFocusOnDropdown = dropdownRef.current?.contains(document.activeElement)
      if (!isFocusOnDropdown) {
        setShowDropdown(false)
        setIsEditing(false)
        if (activeTab) {
          if (activeTab.url === 'gaspra://newtab') {
            setInputValue('')
          } else {
            setInputValue(activeTab.url)
          }
        }
      }
    }, 150)
  }

  // Keyboard Shortcuts (Ctrl+L or F6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault()
        setIsEditing(true)
      }
      if (e.key === 'F6') {
        e.preventDefault()
        setIsEditing(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // --- Bookmark Logic ---
  const currentBookmark = activeTab ? bookmarks.find((b) => b.url === activeTab.url) : null
  const isBookmarked = !!currentBookmark

  const handleToggleBookmark = () => {
    if (!activeTab) return

    if (isBookmarked) {
      deleteBookmark(currentBookmark.id)
    } else {
      addBookmark(activeTab.title || activeTab.url, activeTab.url)
    }
  }
  // ----------------------

  // Filter search history based on input
  const filteredHistory = searchHistory.filter(item =>
    item.query.toLowerCase().includes(inputValue.toLowerCase())
  )

  const handleNavigation = async (url: string) => {
    if (!activeTab) return

    let finalUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('gaspra://')) {
      if (url.includes('.') && !url.includes(' ')) {
        finalUrl = `https://${url}`
      } else {
        await addSearch(url) // Save search query to history
        finalUrl = getSearchUrl(settings?.defaultSearchEngine || 'google', url)
      }
    }

    updateTab(activeTab.id, { url: finalUrl, requestedUrl: finalUrl, title: finalUrl })
    setIsEditing(false)
    setShowDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && filteredHistory[selectedIndex]) {
        handleNavigation(filteredHistory[selectedIndex].query)
      } else {
        handleNavigation(inputValue)
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setShowDropdown(false)
      if (activeTab) {
        if (activeTab.url === 'gaspra://newtab') {
          setInputValue('')
        } else {
          setInputValue(activeTab.url)
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev =>
        prev < filteredHistory.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev =>
        prev > 0 ? prev - 1 : filteredHistory.length - 1
      )
    }
  }

  const handleBack = () => {
    const webview = webviewRefs.current[activeTabId!]
    if (webview && webview.canGoBack()) webview.goBack()
  }

  const handleForward = () => {
    const webview = webviewRefs.current[activeTabId!]
    if (webview && webview.canGoForward()) webview.goForward()
  }

  const handleReload = () => {
    const webview = webviewRefs.current[activeTabId!]
    if (webview) {
      if (webview.isLoading()) {
        webview.stop()
      } else {
        webview.reload()
      }
    }
  }

  const handleHome = () => {
    const homepage = settings?.homepage || 'gaspra://newtab'
    updateTab(activeTabId!, { url: homepage, requestedUrl: homepage, title: homepage })
  }

  if (!activeTab) return null

  return (
    <div className="flex items-center gap-2 px-2 py-2 bg-background">
      {/* Sidebar Toggle & Navigation Controls */}
      <div className="flex items-center gap-1">
        <NavButton
          disabled={!activeTab.canGoBack}
          onClick={handleBack}
          icon={<ArrowLeft size={18} />}
          label="Back"
        />
        <NavButton
          disabled={!activeTab.canGoForward}
          onClick={handleForward}
          icon={<ArrowRight size={18} />}
          label="Forward"
        />

        <NavButton
          onClick={handleReload} 
          icon={activeTab.isLoading ? <X size={16} /> : <RotateCw size={16} />}
          label="Reload"
        />
        <NavButton
          onClick={handleHome}
          icon={<Home size={16} />}
          label="Home"
        />
      </div>

      {/* Address Bar */}
      <div className="flex-1 flex items-center relative">
        <div
          className={`
            relative flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full border-none bg-background outline-none  transition-all truncate
            ${
              isEditing
                ? 'bg-background border-primary shadow-sm '
                : 'bg-muted/50 border-transparent hover:bg-muted hover:border-input cursor-text'
            }
        
          `}
          onClick={() => !isEditing && setIsEditing(true)}
        >
          {/* Icon: Lock or Search */}
          <div className="text-muted-foreground flex-shrink-0">
            {isEditing ? (
              <Search size={14} />
            ) : activeTab.url.startsWith('https') ? (
              <Lock size={12} className="text-green-600 dark:text-green-500" />
            ) : (
              <Search size={14} />
            )}
          </div>

          {/* Input / Display Text */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowDropdown(true)}
              onBlur={handleInputBlur}
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Search or enter website name"
            />
          ) : (
            <div className="flex-1 text-sm text-foreground truncate select-none">
              {activeTab.url === 'gaspra://newtab'
                ? 'Search or enter website name'
                : activeTab.url.replace(/^https?:\/\//, '')}
            </div>
          )}

          {/* Clear Input Button (only when editing and input has value) */}
          {isEditing && inputValue.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setInputValue('')
                inputRef.current?.focus()
              }}
              className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              title="Clear"
            >
              <X size={14} />
            </button>
          )}

          {/* Bookmark Star Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggleBookmark()
            }}
            className={`
              flex-shrink-0 p-1 rounded-md transition-all duration-200
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
              ${
                isBookmarked
                  ? 'text-white hover:bg-yellow-500/10'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }
            `}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <Star size={16} strokeWidth={2} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Search History Dropdown */}
        {isEditing && showDropdown && filteredHistory.length > 0 && (
          <div
            ref={dropdownRef}
            tabIndex={-1}
            className="absolute top-full left-0 right-0 bg-muted border-primary/20 rounded-lg mt-1 shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
              Recent Searches
            </div>
            {filteredHistory.slice(0, 6).map((item, index) => (
              <div
                key={item.id}
                className={`
                  flex items-center justify-between px-3 py-2 cursor-pointer transition-colors
                  ${index === selectedIndex ? 'bg-accent' : 'hover:bg-accent'}
                `}
                onClick={() => handleNavigation(item.query)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Clock size={14} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{item.query}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSearch(item.id)
                  }}
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <NavButton onClick={toggleSidebar} icon={<Bookmark size={18} />} label="Toggle Sidebar" />
        <NavButton
          onClick={() => addTab('gaspra://history')}
          icon={<History size={18} />}
          label="History"
        />
        <NavButton
          onClick={() => addTab('gaspra://settings')}
          icon={<SettingsIcon size={18} />}
          label="Settings"
        />
        <DownloadBubble />
    </div>
  )
}

// Helper Component for Nav Buttons
const NavButton = ({
  onClick,
  icon,
  label,
  disabled
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  disabled?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="
      p-2 rounded-md text-muted-foreground 
      hover:bg-accent hover:text-accent-foreground 
      disabled:opacity-30
      transition-colors duration-200
      focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
    "
    aria-label={label}
  >
    {icon}
  </button>
)

export default Toolbar
