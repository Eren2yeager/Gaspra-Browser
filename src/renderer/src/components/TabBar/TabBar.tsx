import { useBrowser } from '../../context/BrowserContext'
import Tab from './Tab'
import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import WindowControls from '../../components/WindowControls/WindowControls'
import { extractDroppedUrl, isLinkDrag } from '../../lib/droppedUrl'

type DragSession = {
  tabId: number
  index: number
  pointerId: number
  startClientX: number
  startClientY: number
  grabOffsetX: number
  width: number
  outsideStrip: boolean
  moved: boolean
}

const MOVE_THRESHOLD = 5

const TabBar = () => {
  const { tabs, addTab, reorderTabs, tearOffTab, setActiveTab, navigateTab } = useBrowser()
  const stripRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragSession | null>(null)
  const translateRef = useRef(0)
  const tabsRef = useRef(tabs)
  tabsRef.current = tabs

  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragTranslateX, setDragTranslateX] = useState(0)
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(null)
  const [linkDropTabId, setLinkDropTabId] = useState<number | null>(null)
  const [linkDropOnBar, setLinkDropOnBar] = useState(false)

  const setTranslate = (x: number) => {
    translateRef.current = x
    setDragTranslateX(x)
  }

  const clearDrag = () => {
    dragRef.current = null
    setDraggingId(null)
    setTranslate(0)
    setFloatPos(null)
  }

  const clearLinkDrop = () => {
    setLinkDropTabId(null)
    setLinkDropOnBar(false)
    document.documentElement.classList.remove('link-dragging')
  }

  // Allow drops on -webkit-app-region: drag chrome while a link is dragged in.
  useEffect(() => {
    const markLinkDrag = (e: DragEvent) => {
      if (!isLinkDrag(e.dataTransfer)) return
      document.documentElement.classList.add('link-dragging')
    }

    const maybeClear = (e: DragEvent) => {
      // Only clear when leaving the window (relatedTarget null).
      if (e.relatedTarget == null) clearLinkDrop()
    }

    window.addEventListener('dragenter', markLinkDrag)
    window.addEventListener('dragover', markLinkDrag)
    window.addEventListener('dragleave', maybeClear)
    window.addEventListener('drop', clearLinkDrop)
    window.addEventListener('dragend', clearLinkDrop)
    return () => {
      window.removeEventListener('dragenter', markLinkDrag)
      window.removeEventListener('dragover', markLinkDrag)
      window.removeEventListener('dragleave', maybeClear)
      window.removeEventListener('drop', clearLinkDrop)
      window.removeEventListener('dragend', clearLinkDrop)
      document.documentElement.classList.remove('link-dragging')
    }
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const session = dragRef.current
      const strip = stripRef.current
      if (!session || !strip) return
      if (e.pointerId !== session.pointerId) return

      if (
        !session.moved &&
        Math.hypot(e.clientX - session.startClientX, e.clientY - session.startClientY) <
          MOVE_THRESHOLD
      ) {
        return
      }
      session.moved = true

      const stripRect = strip.getBoundingClientRect()
      // Tear-off when leaving the tab strip (not the whole window).
      const outside =
        e.clientY < stripRect.top - 6 ||
        e.clientY > stripRect.bottom + 10 ||
        e.clientX < stripRect.left - 16 ||
        e.clientX > stripRect.right + 16

      session.outsideStrip = outside

      if (outside) {
        setFloatPos({ x: e.clientX - session.grabOffsetX, y: e.clientY - 16 })
        setTranslate(0)
        return
      }

      setFloatPos(null)

      const dragEl = strip.querySelector<HTMLElement>(`[data-tab-id="${session.tabId}"]`)
      if (!dragEl) return

      // Slot origin without current transform so the real tab stays under the cursor.
      const rect = dragEl.getBoundingClientRect()
      const originLeft = rect.left - translateRef.current
      const desiredLeft = e.clientX - session.grabOffsetX
      setTranslate(desiredLeft - originLeft)

      // Reorder by crossing neighbor midpoints (ignore the dragged tab's transformed rect).
      const currentIndex = tabsRef.current.findIndex((t) => t.id === session.tabId)
      if (currentIndex < 0) return
      session.index = currentIndex

      const items = Array.from(strip.querySelectorAll<HTMLElement>('[data-tab-id]'))
      let targetIndex = currentIndex

      for (let i = 0; i < items.length; i++) {
        const id = Number(items[i].dataset.tabId)
        if (id === session.tabId) continue
        const r = items[i].getBoundingClientRect()
        const mid = r.left + r.width / 2
        if (i < currentIndex && e.clientX < mid) {
          targetIndex = i
          break
        }
        if (i > currentIndex && e.clientX > mid) {
          targetIndex = i
        }
      }

      if (targetIndex !== currentIndex) {
        reorderTabs(currentIndex, targetIndex)
        session.index = targetIndex
      }
    }

    const onUp = (e: PointerEvent) => {
      const session = dragRef.current
      if (!session || e.pointerId !== session.pointerId) return

      const shouldTearOff = session.moved && session.outsideStrip
      const tabId = session.tabId
      clearDrag()

      if (shouldTearOff) {
        tearOffTab(tabId, e.screenX, e.screenY)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [reorderTabs, tearOffTab])

  const handlePointerDown = (e: React.PointerEvent, tabId: number, index: number) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('button')) return

    e.preventDefault()
    setActiveTab(tabId)

    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    dragRef.current = {
      tabId,
      index,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      grabOffsetX: e.clientX - rect.left,
      width: rect.width,
      outsideStrip: false,
      moved: false
    }
    setDraggingId(tabId)
    setTranslate(0)
    setFloatPos(null)
    target.setPointerCapture?.(e.pointerId)
  }

  const allowLinkDrop = (e: React.DragEvent) => {
    if (!isLinkDrag(e.dataTransfer)) return false
    e.preventDefault()
    e.dataTransfer.dropEffect = 'link'
    return true
  }

  const handleLinkDragOverTab = (e: React.DragEvent, tabId: number) => {
    if (!allowLinkDrop(e)) return
    setLinkDropTabId(tabId)
    setLinkDropOnBar(false)
  }

  const handleLinkDragLeaveTab = (e: React.DragEvent, tabId: number) => {
    const related = e.relatedTarget as Node | null
    if (related && (e.currentTarget as HTMLElement).contains(related)) return
    setLinkDropTabId((prev) => (prev === tabId ? null : prev))
  }

  const handleLinkDropOnTab = (e: React.DragEvent, tabId: number) => {
    e.preventDefault()
    e.stopPropagation()
    const url = extractDroppedUrl(e.dataTransfer)
    clearLinkDrop()
    if (!url) return
    setActiveTab(tabId)
    navigateTab(tabId, url)
  }

  const handleBarDragOver = (e: React.DragEvent) => {
    if (!allowLinkDrop(e)) return
    // If hovering a tab chip, that handler owns the highlight.
    if ((e.target as HTMLElement).closest('[data-tab-id]')) return
    setLinkDropTabId(null)
    setLinkDropOnBar(true)
  }

  const handleBarDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null
    if (related && (e.currentTarget as HTMLElement).contains(related)) return
    setLinkDropOnBar(false)
    setLinkDropTabId(null)
  }

  const handleBarDrop = (e: React.DragEvent) => {
    e.preventDefault()
    // Tab chips handle their own drop; ignore if landed on one.
    if ((e.target as HTMLElement).closest('[data-tab-id]')) return
    const url = extractDroppedUrl(e.dataTransfer)
    clearLinkDrop()
    if (!url) return
    addTab(url)
  }

  const floatingTab = draggingId != null ? tabs.find((t) => t.id === draggingId) : null

  return (
    <div
      className={`flex items-center w-full bg-primary/10 h-10 pl-1 pt-1 ${
        linkDropOnBar ? 'ring-1 ring-inset ring-primary/60' : ''
      }`}
      style={{ WebkitAppRegion: 'drag' } as any}
      onDragOver={handleBarDragOver}
      onDragLeave={handleBarDragLeave}
      onDrop={handleBarDrop}
    >
      <div
        ref={stripRef}
        className="flex items-center gap-1 overflow-hidden"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={tab.id}
            id={tab.id}
            title={tab.title}
            url={tab.url}
            isLoading={tab.isLoading}
            favicon={tab.favicon}
            index={index}
            isDragging={draggingId === tab.id}
            isGhost={draggingId === tab.id && floatPos != null}
            isLinkDropTarget={linkDropTabId === tab.id}
            dragTranslateX={draggingId === tab.id && !floatPos ? dragTranslateX : 0}
            onPointerDownTab={handlePointerDown}
            onLinkDragOverTab={handleLinkDragOverTab}
            onLinkDragLeaveTab={handleLinkDragLeaveTab}
            onLinkDropOnTab={handleLinkDropOnTab}
          />
        ))}
      </div>

      <button
        onClick={() => addTab()}
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className={`
          flex items-center justify-center 
          w-8 h-8 
          rounded-md 
          text-muted-foreground 
          hover:bg-primary/20 hover:text-foreground 
          transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
          flex-shrink-0
          ${linkDropOnBar ? 'bg-primary/20 text-foreground ring-1 ring-primary' : ''}
        `}
        aria-label="New Tab"
      >
        <Plus size={16} strokeWidth={2} />
      </button>

      <div
        className="flex-1 h-full"
        onDoubleClick={() => window.browserAPI.toggleMaximizeWindow()}
      />

      <WindowControls />

      {floatingTab && floatPos && (
        <div
          className="pointer-events-none fixed z-[9999] flex items-center gap-1 p-2 w-[200px] rounded-md bg-primary/30 text-foreground shadow-lg border border-border"
          style={{ left: floatPos.x, top: floatPos.y }}
        >
          <span className="truncate text-xs font-medium flex-1">
            {floatingTab.title || 'New Tab'}
          </span>
        </div>
      )}
    </div>
  )
}

export default TabBar
