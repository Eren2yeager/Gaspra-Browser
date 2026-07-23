import { JSX, useState } from 'react'
import { useBrowser } from '../../context/BrowserContext'
import { X, Globe, History, Download, SettingsIcon } from 'lucide-react'
import { SpinnerCustom } from '../ui/Spinner'
import { AppIcon } from '../CustomIcons/AppIcon'

interface TabProps {
  id: number
  title: string
  url: string
  isLoading: boolean
  favicon?: string
  index: number
  isDragging: boolean
  isGhost: boolean
  isLinkDropTarget: boolean
  dragTranslateX: number
  onPointerDownTab: (e: React.PointerEvent, tabId: number, index: number) => void
  onLinkDragOverTab: (e: React.DragEvent, tabId: number) => void
  onLinkDragLeaveTab: (e: React.DragEvent, tabId: number) => void
  onLinkDropOnTab: (e: React.DragEvent, tabId: number) => void
}

const Tab = ({
  id,
  title,
  url,
  isLoading,
  favicon,
  index,
  isDragging,
  isGhost,
  isLinkDropTarget,
  dragTranslateX,
  onPointerDownTab,
  onLinkDragOverTab,
  onLinkDragLeaveTab,
  onLinkDropOnTab
}: TabProps): JSX.Element => {
  const { closeTab, activeTabId } = useBrowser()
  const isActive = activeTabId === id

  const getHostname = (): string => {
    try {
      return new URL(url).hostname
    } catch {
      return ''
    }
  }

  const hostname = getHostname()
  const [faviconError, setFaviconError] = useState(false)

  const getInternalPageIcon = () => {
    if (url === 'gaspra://newtab') {
      return <AppIcon size={16} className="w-4 h-4  grayscale" />
    }
    if (url === 'gaspra://history') {
      return <History className="w-4 h-4" />
    }
    if (url === 'gaspra://downloads') {
      return <Download className="w-4 h-4" />
    }
    if (url === 'gaspra://settings') {
      return <SettingsIcon className="w-4 h-4" />
    }
    return null
  }

  const internalIcon = getInternalPageIcon()
  const faviconSrc =
    favicon ||
    (hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32` : null)

  return (
    <div
      data-tab-id={id}
      className="flex items-center gap-1 flex-1 min-w-0"
      style={{
        transform: isDragging && !isGhost ? `translateX(${dragTranslateX}px)` : undefined,
        zIndex: isDragging ? 20 : undefined,
        opacity: isGhost ? 0.35 : 1,
        transition: isDragging ? 'none' : 'transform 120ms ease-out'
      }}
    >
      <div
        className={`
        group relative flex items-center gap-1 p-2 mt-1 mb-1
        min-w-0 w-[200px]
        rounded-md
        cursor-grab active:cursor-grabbing select-none
        hover:bg-primary/10 hover:text-foreground
        ${
          isActive
            ? 'bg-primary/20 text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }
        ${isDragging && !isGhost ? 'shadow-md ring-1 ring-border bg-primary/25' : ''}
        ${isLinkDropTarget ? 'ring-2 ring-primary bg-primary/30 text-foreground' : ''}
      `}
        onPointerDown={(e) => onPointerDownTab(e, id, index)}
        onDragOver={(e) => onLinkDragOverTab(e, id)}
        onDragLeave={(e) => onLinkDragLeaveTab(e, id)}
        onDrop={(e) => onLinkDropOnTab(e, id)}
      >
        {isLoading ? (
          <SpinnerCustom />
        ) : (
          <div className="truncate">
            {internalIcon ? (
              internalIcon
            ) : faviconSrc && !faviconError ? (
              <img
                src={faviconSrc}
                alt=""
                width={16}
                height={16}
                className="w-4 h-4 rounded-sm pointer-events-none"
                draggable={false}
                onError={() => setFaviconError(true)}
              />
            ) : (
              <Globe className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        )}

        <span className="truncate text-xs font-medium flex-1">
          {title || hostname || 'New Tab'}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation()
            closeTab(id)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`
          flex items-center justify-center p-0.5 rounded-md
          opacity-0 group-hover:opacity-100 transition-opacity
          hover:bg-primary/20 hover:text-foreground
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
          ${isActive ? 'text-foreground/70' : 'text-muted-foreground'}
        `}
          aria-label="Close tab"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      </div>
      <div className="w-[2px] h-[15px] bg-primary rounded" />
    </div>
  )
}

export default Tab
