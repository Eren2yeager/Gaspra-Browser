import { useState } from 'react'
import { Search, Rocket } from 'lucide-react'
import { useBrowser } from '../../context/BrowserContext'
import { useSettings } from '../../context/SettingsContext'
import { AppIcon } from '../CustomIcons/AppIcon'
import QuickLinksGrid from '../QuickLinks/QuickLinksGrid'

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

function pathToFileUrl(filePath: string): string {
  // Simple way to convert a file path to file URL that works on all platforms
  // Handle Windows drive letters like C:\
  if (/^[a-zA-Z]:\\/.test(filePath)) {
    return 'file:///' + filePath.replace(/\\/g, '/')
  }
  // Handle Unix-style paths and network paths
  return 'file://' + filePath.replace(/\\/g, '/')
}

export default function NewTabPage() {
  const { navigateTab, activeTabId, tabs, setActiveTab } = useBrowser()
  const { settings, isLoading } = useSettings()
  const [searchQuery, setSearchQuery] = useState('')

  console.log('NewTabPage - Settings:', settings)
  console.log('NewTabPage - isLoading:', isLoading)

  const handleNavigate = (url: string): void => {
    if (!activeTabId) return

    if (url.startsWith('gaspra://') && url !== 'gaspra://newtab') {
      const existingTab = tabs.find((tab) => tab.url === url)
      if (existingTab) {
        setActiveTab(existingTab.id)
        return
      }
    }

    navigateTab(activeTabId, url)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const searchUrl = getSearchUrl(settings?.defaultSearchEngine || 'google', searchQuery)
      handleNavigate(searchUrl)
    }
  }

  const fileUrl = settings?.backgroundPath ? pathToFileUrl(settings.backgroundPath) : null
  console.log('NewTabPage - File URL:', fileUrl)

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden">
      {/* Background */}
      {settings?.backgroundType && settings.backgroundType !== 'none' && fileUrl && (
        <>
          {settings.backgroundType === 'image' && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${fileUrl}')` }}
            />
          )}
          {settings.backgroundType === 'video' && (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              src={fileUrl}
            />
          )}
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-background/10" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <AppIcon size={120} className="mb-4" />
        <h1 className="text-3xl font-bold mb-8 ">Gaspra Browser</h1>
        <div className="w-full max-w-3xl px-6">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative w-full">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2  z-10 text-primary"
              />
              <input
                type="text"
                placeholder="Search or enter URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-12 pr-12 py-3 text-lg rounded-full shadow-2xl
                  border border-input bg-background/80 backdrop-blur
                  focus:outline-none focus:ring-2 focus:ring-ring
                  placeholder:text-muted-foreground 
                  transition-all
                "
                autoFocus
              />
              {searchQuery && (
                <button
                  type="submit"
                  className="
                    absolute right-2 top-1/2 -translate-y-1/2
                    p-2 rounded-full bg-primary text-primary-foreground
                    hover:opacity-90 transition-opacity
                  "
                >
                  <Rocket size={20} className="text-primary-foreground" />
                </button>
              )}
            </div>
          </form>

          <div className="mt-12">
            <QuickLinksGrid onNavigate={handleNavigate} />
          </div>
        </div>
      </div>
    </div>
  )
}
