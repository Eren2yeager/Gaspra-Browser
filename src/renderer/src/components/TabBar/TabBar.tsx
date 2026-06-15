import { useBrowser } from '../../context/BrowserContext'
import Tab from './Tab' 
import { Plus } from 'lucide-react'
import { useState } from 'react'
import WindowControls from '../../components/WindowControls/WindowControls'

const TabBar = () => {
  const { tabs, addTab, reorderTabs } = useBrowser()
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      reorderTabs(dragIndex, index)
      setDragIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  return (
    <div className="flex items-center w-full bg-primary/10 h-10 pl-1 pt-1 " style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Tab List - No scrollbar, tabs shrink instead */}
      <div className="flex items-center gap-1 overflow-hidden" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {tabs.map((tab, index) => (
          <Tab 
            key={tab.id} 
            id={tab.id} 
            title={tab.title} 
            url={tab.url} 
            isLoading={tab.isLoading}
            index={index}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Add New Tab Button */}
      <button
        onClick={() => addTab()}
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className="
          flex items-center justify-center 
          w-8 h-8 
          rounded-md 
          text-muted-foreground 
          hover:bg-primary/20 hover:text-foreground 
          transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
          flex-shrink-0
        "
        aria-label="New Tab"
      >
        <Plus size={16} strokeWidth={2} />
      </button>

      <div
        className="flex-1 h-full"
        onDoubleClick={() => window.browserAPI.toggleMaximizeWindow()}
      />

      <WindowControls />
    </div>
  )
}

export default TabBar
