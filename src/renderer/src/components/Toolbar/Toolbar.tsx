import React, { useState, useEffect, useRef } from 'react'
import { useBrowser } from '../../context/BrowserContext'
import { useBookmark } from '../../context/BookmarkContext'
import { ArrowLeft, ArrowRight, RotateCw,X, Search, Lock, Star, Bookmark ,History} from 'lucide-react'
const Toolbar = () => {
  const { addTab , tabs, activeTabId, updateTab, webviewRefs } = useBrowser()
  const { bookmarks, addBookmark, deleteBookmark, toggleSidebar } = useBookmark()

  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync local input value with active tab URL
  useEffect(() => {
    if (activeTab) {
      setInputValue(activeTab.url)
    }
  }, [activeTab?.id, activeTab?.url])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

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
  const currentBookmark = activeTab ? bookmarks.find(b => b.url === activeTab.url) : null
  const isBookmarked = !!currentBookmark

  const handleToggleBookmark = () => {
    if (!activeTab) return

    if (isBookmarked) {
      // Remove bookmark
      deleteBookmark(currentBookmark.id)
    } else {
      // Add bookmark
      addBookmark(activeTab.title || activeTab.url, activeTab.url)
    }
  }
  // ----------------------

  const handleNavigation = (url: string) => {
    if (!activeTab) return

    let finalUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        finalUrl = `https://${url}`
      } else {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`
      }
    }

    updateTab(activeTab.id, { url: finalUrl, title: finalUrl })

    const webview = webviewRefs.current[activeTab.id]
    if (webview) {
      if (webview.isLoading()) webview.stop()
      webview.loadURL(finalUrl)
    }

    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNavigation(inputValue)
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setInputValue(activeTab?.url || '')
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

  if (!activeTab) return null

  return (
    <div className="flex items-center gap-2 px-2 py-2 bg-background">
      {/* Sidebar Toggle & Navigation Controls */}
      <div className="flex items-center gap-1">
        <NavButton  onClick={handleBack} icon={<ArrowLeft size={18} />} label="Back" />
        <NavButton onClick={handleForward} icon={<ArrowRight size={18} />} label="Forward" />
        <NavButton onClick={handleReload} icon={activeTab.isLoading ? <X size={16} /> : <RotateCw size={16} />} label="Reload" />
      </div>

      {/* Address Bar */}
      <div className="flex-1 flex items-center">
        <div 
          className={`
            relative flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all
            ${isEditing 
              ? 'bg-background border-primary ring-1 ring-primary shadow-sm' 
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
              onBlur={() => {
                setIsEditing(false)
                setInputValue(activeTab.url)
              }}
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Search or enter website name"
            />
          ) : (
            <span className="flex-1 text-sm text-foreground truncate select-none">
              {activeTab.url.replace(/^https?:\/\//, '')}
            </span>
          )}

          {/* Bookmark Star Button */}
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent triggering the address bar edit mode
              handleToggleBookmark()
            }}
            className={`
              flex-shrink-0 p-1 rounded-md transition-all duration-200
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
              ${isBookmarked 
                ? 'text-white-500 hover:bg-yellow-500/10' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }
            `}
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <Star 
              size={16} 
              strokeWidth={2} 
              fill={isBookmarked ? "currentColor" : "none"} 
            />
          </button>
        </div>
      </div>
        <NavButton onClick={toggleSidebar} icon={<Bookmark size={18} />} label="Toggle Sidebar" />
        <NavButton onClick={() => addTab('gaspra://history')} icon={<History size={18} />} label="History" />

    </div>
  )
}

// Helper Component for Nav Buttons
const NavButton = ({ onClick, icon, label }: { onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className="
      p-2 rounded-md text-muted-foreground 
      hover:bg-accent hover:text-accent-foreground 
      disabled:opacity-30 disabled:cursor-not-allowed
      transition-colors duration-200
      focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
    "
    aria-label={label}
  >
    {icon}
  </button>
)

export default Toolbar