import { useBrowser } from '../../context/BrowserContext'
import Tab from './Tab' 
import { Plus } from 'lucide-react'
import WindowControls from '../WindowControls/WindowControls'

const TabBar = () => {
  const { tabs, addTab } = useBrowser()

  return (
    <div className="flex items-center w-full bg-muted/30 h-10 pl-2 pt-1 gap-1" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Tab List - No scrollbar, tabs shrink instead */}
      <div className="flex items-center flex gap-1 overflow-hidden" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {tabs.map((tab) => (
          <Tab 
            key={tab.id} 
            id={tab.id} 
            title={tab.title} 
            url={tab.url} 
            isLoading={tab.isLoading}
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
          hover:bg-accent hover:text-accent-foreground 
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

      {/* <WindowControls /> */}
    </div>
  )
}

export default TabBar
