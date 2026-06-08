import { useState } from 'react'
import { Search, Plus, ArrowRight } from 'lucide-react'
import { useBrowser } from '../../context/BrowserContext'
import { useSettings } from '../../context/SettingsContext'

// Helper to get search URL from search engine
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

export default function NewTabPage() {
  const { addTab } = useBrowser()
  const { settings } = useSettings()
  const [searchQuery, setSearchQuery] = useState('')
  const quickLinks = [
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'YouTube', url: 'https://www.youtube.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Twitter', url: 'https://twitter.com' },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const searchUrl = getSearchUrl(settings?.defaultSearchEngine || 'google', searchQuery)
      addTab(searchUrl)
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-8">Gaspra Browser</h1>
      <div className="w-full max-w-xl px-6">
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative w-full">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search or enter URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-12 pr-12 py-3 text-lg rounded-full
                border border-input bg-muted
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
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </form>

        <div className="mt-12">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Quick Links</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map((link) => (
              <button
                key={link.url}
                onClick={() => addTab(link.url)}
                className="
                  flex flex-col items-center gap-2 p-4 rounded-lg
                  bg-muted/20 border border-border
                  hover:bg-muted/40 hover:border-primary/30
                  transition-all
                "
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus size={20} className="text-primary" />
                </div>
                <span className="text-sm font-medium">{link.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
