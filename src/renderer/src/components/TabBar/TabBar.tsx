import React from 'react'
import { useBrowser } from '../../context/BrowserContext'
import Tab from './Tab' 
import { Plus } from 'lucide-react'

const TabBar = () => {
  const { tabs, addTab } = useBrowser()

  return (
    <div className="flex items-center w-full bg-muted/30 h-10 px-1 gap-1">
      {/* Scrollable Tab List */}
      <div className="flex items-center flex overflow-x-auto no-scrollbar gap-1">
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
    </div>
  )
}

export default TabBar