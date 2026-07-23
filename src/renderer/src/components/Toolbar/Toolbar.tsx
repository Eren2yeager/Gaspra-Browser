import React, { useState, useEffect, useRef } from 'react'
import { useBrowser } from '../../context/BrowserContext'
import { useBookmark } from '../../context/BookmarkContext'
import { useSearchHistory } from '../../context/SearchHistoryContext'
import { useSettings } from '../../context/SettingsContext'
import { useHistory } from '../../context/HistoryContext'
import { useDownload } from '../../context/DownloadContext'
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  X,
  Search,
  Lock,
  Star,
  Home,
  Clock,
  MoreVertical,
  ChevronDown
} from 'lucide-react'
import DownloadBubble from '../DownloadBubble/DownloadBubble'
import { AppIcon } from '../CustomIcons/AppIcon'
import { SearchEngineIcon } from '../CustomIcons/SearchEngineIcon'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { extractDroppedUrl, isLinkDrag } from '../../lib/droppedUrl'

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
  const { addTab, tabs, activeTabId, navigateTab, setActiveTab, goBack, goForward, reload } =
    useBrowser()
  const { bookmarks, addBookmark, deleteBookmark, toggleSidebar, isSidebarOpen } = useBookmark()
  const { searchHistory, addSearch, clearSearchHistory, deleteSearch } = useSearchHistory()
  const { settings, updateSetting, resetSettings } = useSettings()
  const { clearHistory } = useHistory()
  const { clearDownloads } = useDownload()

  const activeTab = tabs.find((tab) => tab.id === activeTabId)

  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeTab) {
      if (activeTab.url === 'gaspra://newtab') {
        setInputValue('')
      } else {
        setInputValue(activeTab.url)
      }
    }
  }, [activeTab?.id]) // Only reset when switching tabs, not when URL changes on same tab

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
      setShowDropdown(true)
    }
  }, [isEditing])

  const handleInputBlur = () => {
    setTimeout(() => {
      const isFocusOnDropdown = dropdownRef.current?.contains(document.activeElement)
      if (!isFocusOnDropdown) {
        setShowDropdown(false)
        setIsEditing(false)
      }
    }, 150)
  }

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

  const currentBookmark = activeTab ? bookmarks.find((b) => b.url === activeTab.url) : null
  const isBookmarked = !!currentBookmark

  const handleToggleBookmark = () => {
    if (!activeTab) return

    if (isBookmarked && currentBookmark) {
      deleteBookmark(currentBookmark.id)
    } else {
      addBookmark(activeTab.title || activeTab.url, activeTab.url)
    }
  }

  const filteredHistory = searchHistory.filter((item) =>
    item.query.toLowerCase().includes(inputValue.toLowerCase())
  )

  const openInternalPage = (path: 'history' | 'downloads' | 'settings') => {
    addTab(`gaspra://${path}`)
  }

  const handleNavigation = async (url: string) => {
    if (!activeTab) return

    let finalUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('gaspra://')) {
      if (url.includes('.') && !url.includes(' ')) {
        finalUrl = `https://${url}`
      } else {
        await addSearch(url)
        finalUrl = getSearchUrl(settings?.defaultSearchEngine || 'google', url)
      }
    }

    if (finalUrl.startsWith('gaspra://') && finalUrl !== 'gaspra://newtab') {
      const existingTab = tabs.find((tab) => tab.url === finalUrl)
      if (existingTab) {
        setActiveTab(existingTab.id)
        setIsEditing(false)
        setShowDropdown(false)
        return
      }
    }

    navigateTab(activeTab.id, finalUrl)
    setInputValue(finalUrl)
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
      setSelectedIndex((prev) => (prev < filteredHistory.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredHistory.length - 1))
    }
  }

  const handleBack = () => goBack()
  const handleForward = () => goForward()
  const handleReload = () => reload()

  const handleHome = () => {
    const homepage = settings?.homepage || 'gaspra://newtab'
    navigateTab(activeTabId!, homepage)
  }

  const openBrowserMenu = () => {
    window.browserAPI.showBrowserMenu({
      isSidebarOpen,
      isBookmarked,
      defaultSearchEngine: settings?.defaultSearchEngine || 'google',
      saveHistory: settings?.saveHistory ?? false,
      saveSearchHistory: settings?.saveSearchHistory ?? false,
      saveDownloadHistory: settings?.saveDownloadHistory ?? false,
      askWhereToSave: settings?.askWhereToSave ?? false,
      saveTabsOnClose: settings?.saveTabsOnClose ?? false,
      blockPopups: settings?.blockPopups ?? false,
      enableJavaScript: settings?.enableJavaScript ?? false,
      enableImages: settings?.enableImages ?? false,
      hardwareAcceleration: settings?.hardwareAcceleration ?? false
    })
  }

  useEffect(() => {
    const unsub = window.browserAPI.onBrowserMenuAction(({ action, value }) => {
      switch (action) {
        case 'new-tab':
          addTab()
          break
        case 'home':
          handleHome()
          break
        case 'open-downloads':
          openInternalPage('downloads')
          break
        case 'open-history':
          openInternalPage('history')
          break
        case 'open-settings':
          openInternalPage('settings')
          break
        case 'toggle-sidebar':
          if (typeof value === 'boolean') {
            if (value !== isSidebarOpen) toggleSidebar()
          } else {
            toggleSidebar()
          }
          break
        case 'toggle-bookmark':
          handleToggleBookmark()
          break
        case 'set-search-engine':
          if (
            value === 'google' ||
            value === 'bing' ||
            value === 'duckduckgo' ||
            value === 'yahoo'
          ) {
            updateSetting('defaultSearchEngine', value)
          }
          break
        case 'set-save-history':
          updateSetting('saveHistory', Boolean(value))
          break
        case 'set-save-search-history':
          updateSetting('saveSearchHistory', Boolean(value))
          break
        case 'set-save-download-history':
          updateSetting('saveDownloadHistory', Boolean(value))
          break
        case 'set-ask-where-to-save':
          updateSetting('askWhereToSave', Boolean(value))
          break
        case 'set-save-tabs-on-close':
          updateSetting('saveTabsOnClose', Boolean(value))
          break
        case 'set-block-popups':
          updateSetting('blockPopups', Boolean(value))
          break
        case 'set-enable-javascript':
          updateSetting('enableJavaScript', Boolean(value))
          break
        case 'set-enable-images':
          updateSetting('enableImages', Boolean(value))
          break
        case 'set-hardware-acceleration':
          updateSetting('hardwareAcceleration', Boolean(value))
          break
        case 'clear-history':
          clearHistory()
          break
        case 'clear-search-history':
          clearSearchHistory()
          break
        case 'clear-download-history':
          clearDownloads()
          break
        case 'reset-settings':
          resetSettings()
          break
        default:
          break
      }
    })
    return unsub
  })

  const handleToolbarDragOver = (e: React.DragEvent) => {
    if (!isLinkDrag(e.dataTransfer)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'link'
  }

  const handleToolbarDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const url = extractDroppedUrl(e.dataTransfer)
    if (!url) return

    // Dropping on the address bar navigates the current tab (Chrome-like).
    const onAddressBar = !!(e.target as HTMLElement).closest('[data-address-bar]')
    if (onAddressBar && activeTab) {
      navigateTab(activeTab.id, url)
      setInputValue(url)
      setIsEditing(false)
      return
    }

    addTab(url)
  }

  if (!activeTab) return null
  return (
    <div
      className="flex items-center gap-2 px-2 py-2 bg-primary/10"
      onDragOver={handleToolbarDragOver}
      onDrop={handleToolbarDrop}
    >
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
        <NavButton onClick={handleHome} icon={<Home size={16} />} label="Home" />
      </div>

      <div className="flex-1 min-w-0 flex items-center relative">
        <div
          data-address-bar
          className={`
            relative flex-1 min-w-0 flex items-center gap-2 px-3 py-1.5 rounded-full
                border border-input bg-muted
                focus:outline-none focus:ring-2 focus:ring-ring
                placeholder:text-muted-foreground transition-all
            ${
              isEditing
                ? 'bg-primary/10 border-primary shadow-sm  '
                : 'bg-primary/20 border-transparent hover:bg-primary/30 hover:border-input'
            }
          `}
          onClick={() => !isEditing && setIsEditing(true)}
        >
          {/* Left section: icons/capsule */}
          {activeTab.url.startsWith('gaspra://') ? (
            activeTab.url === 'gaspra://newtab' ? (
              // New tab: search engine selector capsule (always show)
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                    className="flex items-center gap-1.5 p-0.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/30 transition-colors"
                  >
                    <SearchEngineIcon 
                      engine={settings?.defaultSearchEngine || 'google'} 
                      className="bg-muted/50 p-[2px]  rounded-full"
                      size={20} 
                    />
                    <span className="capitalize font-medium">
                      {settings?.defaultSearchEngine || 'google'}
                    </span>
                    <ChevronDown size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Select Search Engine</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={settings?.defaultSearchEngine === 'google'}
                    onCheckedChange={() => updateSetting('defaultSearchEngine', 'google')}
                  >
                    <div className="flex items-center gap-2">
                      <SearchEngineIcon engine="google" size={16} />
                      <span>Google</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={settings?.defaultSearchEngine === 'bing'}
                    onCheckedChange={() => updateSetting('defaultSearchEngine', 'bing')}
                  >
                    <div className="flex items-center gap-2">
                      <SearchEngineIcon engine="bing" size={16} />
                      <span>Bing</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={settings?.defaultSearchEngine === 'duckduckgo'}
                    onCheckedChange={() => updateSetting('defaultSearchEngine', 'duckduckgo')}
                  >
                    <div className="flex items-center gap-2">
                      <SearchEngineIcon engine="duckduckgo" size={16} />
                      <span>DuckDuckGo</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={settings?.defaultSearchEngine === 'yahoo'}
                    onCheckedChange={() => updateSetting('defaultSearchEngine', 'yahoo')}
                  >
                    <div className="flex items-center gap-2">
                      <SearchEngineIcon engine="yahoo" size={16} />
                      <span>Yahoo</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Other internal pages: Gaspra capsule (always show)
              <div className=" align-center  flex items-center gap-1 p-0.5 pr-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                <AppIcon size={20} className='bg-muted/50  rounded-full'/>
                <span className="font-medium">Gaspra</span>
              </div>
            )
          ) : (
            // Regular web pages
            isEditing ? (
              <div className="text-muted-foreground flex-shrink-0">
                <Search size={14} className="text-primary" />
              </div>
            ) : (
              <div className="text-muted-foreground flex-shrink-0">
                {activeTab.url.startsWith('https') ? (
                  <Lock size={12} className="text-green-600 dark:text-green-500" />
                ) : (
                  <Search size={14} className="text-muted-foreground" />
                )}
              </div>
            )
          )}

          {/* Middle section: input/display */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowDropdown(true)}
              onBlur={handleInputBlur}
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Search or enter website name"
            />
          ) : (
            <div className="flex-1 min-w-0 w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm text-foreground select-none">
              {/* If inputValue is different from active tab's URL, show what user typed */}
              {inputValue && 
               (activeTab.url === 'gaspra://newtab' ? inputValue !== '' : inputValue !== activeTab.url) 
                ? inputValue 
                : activeTab.url === 'gaspra://newtab'
                  ? 'Search or enter website name'
                  : activeTab.url.startsWith('gaspra://')
                  ? activeTab.url.replace('gaspra://', '')
                  : activeTab.url.replace(/^https?:\/\//, '')}
            </div>
          )}

          {/* Right section: clear and bookmark */}
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

          {!activeTab.url.startsWith('gaspra://') && (
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
                    ? 'text-primary hover:bg-primary/20'
                    : 'text-muted-foreground hover:bg-primary/20 hover:text-primary'
                }
              `}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              <Star size={16} strokeWidth={2} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        {isEditing && showDropdown && filteredHistory.length > 0 && (
          <div
            ref={dropdownRef}
            tabIndex={-1}
            className="absolute top-full left-0 right-0 bg-muted border-primary/20 rounded-lg mt-1 shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            <div className="px-3 py-2 text-xs font-semibold bg-primary/20 text-foreground">
              Recent Searches
            </div>
            {filteredHistory.slice(0, 6).map((item, index) => (
              <div
                key={item.id}
                className={`
                  flex items-center justify-between bg-primary/20 text-foreground   px-3 py-2 cursor-pointer transition-colors
                  ${index === selectedIndex ? 'bg-accent' : 'hover:bg-primary/30'}
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

      <DownloadBubble />

      <button
        onClick={openBrowserMenu}
        className="p-2 rounded-md text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="Browser menu"
        title="Browser menu"
      >
        <MoreVertical size={18} />
      </button>
    </div>
  )
}

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
      hover:bg-primary/20 hover:text-primary
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
