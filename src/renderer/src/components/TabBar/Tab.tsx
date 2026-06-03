import  { useState } from 'react'
import { useBrowser } from '../../context/BrowserContext'
import { X, Globe , } from 'lucide-react'
import {SpinnerCustom} from '../ui/Spinner'
interface TabProps {
  id: number
  title: string
  url: string
  isLoading: boolean
}

const Tab = ({ id, title, url , isLoading }: TabProps) => {
  const { setActiveTab, closeTab, activeTabId } = useBrowser()

  const isActive = activeTabId === id

  // Helper to safely get hostname
  const getHostname = () => {
    try {
      return new URL(url).hostname
    } catch (e) {
      return ''
    }
  }

  const hostname = getHostname()
  const [faviconError, setFaviconError] = useState(false)

  return (
    <div
      className={`
        group relative flex items-center gap-2 px-3 py-2 
        min-w-[120px] max-w-[200px] 
        border-r border-border/50 rounded
        cursor-pointer select-none
        transition-all duration-200 ease-in-out 
        hover:bg-zinc-800 hover:text-foreground
        ${
          isActive
            ? 'bg-background text-foreground shadow-sm z-10 bg-zinc-800'
            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
        }
      `}
      onClick={() => setActiveTab(id)}
    >
      {isLoading ? (
  <SpinnerCustom />
) : (
      <div className="flex-shrink-0">
        
        {hostname && !faviconError ? (
          <img
            src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
            alt=""
            width={16}
            height={16}
            className="w-4 h-4 rounded-sm"
            onError={() => setFaviconError(true)}
          />
        ) : (
          <Globe className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
)}


      {/* Title Text with Truncation */}
      <span className="truncate text-xs font-medium flex-1">{title || hostname || 'New Tab'}</span>

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
      {isActive && <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />}
    </div>
  )
}

export default Tab
