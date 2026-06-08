import { JSX, useState } from 'react'
import { useBrowser } from '../../context/BrowserContext'
import { X, Globe, Home, History, Download , SettingsIcon } from 'lucide-react'
import { SpinnerCustom } from '../ui/Spinner'
interface TabProps {
  id: number
  title: string
  url: string
  isLoading: boolean
  
}

const Tab = ({ id, title, url, isLoading }: TabProps) : JSX.Element => {
  const { setActiveTab, closeTab, activeTabId } = useBrowser()

  const isActive = activeTabId === id

  // Helper to safely get hostname
  const getHostname = () : string => {
    try {
      return new URL(url).hostname
    } catch (e) {
      return ''
    }
  } 

  const hostname = getHostname()
  const [faviconError, setFaviconError] = useState(false)

  // Get icon based on internal page
  const getInternalPageIcon = () => {
    if (url === 'gaspra://newtab') {
      return <Home className="w-4 h-4 text-muted-foreground" />
    }
    if (url === 'gaspra://history') {
      return <History className="w-4 h-4 text-muted-foreground" />
    }
    if (url === 'gaspra://downloads') {
      return <Download className="w-4 h-4 text-muted-foreground" />
    }
    if (url === 'gaspra://settings') {
      return <SettingsIcon className="w-4 h-4 text-muted-foreground" />
    }
    return null
  }

  const internalIcon = getInternalPageIcon()

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <div
        className={`
        group relative flex items-center gap-1  p-1.5
        min-w-0 w-[200px] 
        rounded-md
        cursor-pointer select-none
        transition-all duration-200 ease-in-out 
        hover:bg-muted hover:text-foreground
        ${
          isActive
            ? 'bg-background text-foreground shadow-sm z-10 bg-muted'
            : ' text-muted-foreground hover:bg-muted hover:text-foreground'
        }
      `}
        onClick={() => setActiveTab(id)}
      >
        {isLoading ? (
          <SpinnerCustom />
        ) : (
          <div className="truncate">
            {internalIcon ? (
              internalIcon
            ) : hostname && !faviconError ? (
              <img
                src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                alt=""
                width={16}
                height={16}
                className="w-4 h-4 transition-transform duration-300 ease-out hover:scale-110 rounded-sm"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <Globe className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        )}

        {/* Title Text with Truncation */}
        <span className="truncate text-xs font-medium flex-1">
          {title || hostname || 'New Tab'}
        </span>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            closeTab(id)
          }}
          className={`
          flex items-center justify-center p-0.5 rounded-md 
          opacity-0 group-hover:opacity-100 transition-opacity
          hover:bg-accent hover:text-accent-foreground
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
          ${isActive ? 'text-foreground/70' : 'text-muted-foreground'}
        `}
          aria-label="Close tab"
        >
          <X size={12} strokeWidth={2.5} />
        </button>

        {/* Active Indicator Top Border (Shadcn Style) */}
      </div>
      <div className="w-[2px] h-[15px] bg-muted rounded" />
    </div>
  )
}

export default Tab
