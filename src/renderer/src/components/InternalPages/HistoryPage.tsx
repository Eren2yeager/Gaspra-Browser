import { useState } from 'react'
import { useHistory } from '../../context/HistoryContext'
import { useBrowser } from '../../context/BrowserContext'
import { Clock, Trash2, Search, Globe } from 'lucide-react'

export default function HistoryPage() {
  const { history, clearHistory } = useHistory()
  const { activeTabId, updateTab, webviewRefs, tabs, setActiveTab } = useBrowser()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredHistory = history.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNavigate = (url: string) => {
    if (!activeTabId) return

    // Check if it's an internal page (gaspra://) and not newtab
    if (url.startsWith('gaspra://') && url !== 'gaspra://newtab') {
      // Find existing tab with this URL
      const existingTab = tabs.find(tab => tab.url === url)
      if (existingTab) {
        // Activate the existing tab instead of updating current
        setActiveTab(existingTab.id)
        return
      }
    }

    updateTab(activeTabId, { url, title: url })
    const webview = webviewRefs.current[activeTabId]
    if (webview) webview.loadURL(url)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="w-full h-full flex flex-col p-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Clock size={24} className="text-muted-foreground" />
          History
        </h1>
        <button
          onClick={clearHistory}
          disabled={history.length === 0}
          className="
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            bg-destructive/10 text-destructive hover:bg-destructive/20
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors
          "
        >
          <Trash2 size={14} />
          Clear History
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="
            w-full pl-9 pr-4 py-2 text-sm rounded-full   bg-muted placeholder:text-muted-foreground
            focus:outline-none focus:ring-[1px] focus:ring-muted
   transition-all
          "
        />
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
            <Clock size={32} className="mb-3 opacity-20" />
            <p>{searchQuery ? 'No history matches your search.' : 'No history yet.'}</p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {filteredHistory.map((item) => (
              <li
                key={item.id}
                onClick={() => handleNavigate(item.url)}
                className="
                  group flex items-center gap-3 px-4 py-3 rounded-md
                  hover:bg-accent hover:text-accent-foreground
                  cursor-pointer transition-colors
                "
              >
                {/* Favicon */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=32`}
                  alt=""
                  width={16}
                  height={16}
                  className="w-4 h-4 flex-shrink-0 rounded-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <Globe size={14} className="hidden text-muted-foreground flex-shrink-0" />

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.url.replace(/^https?:\/\//, '')}
                  </div>
                </div>

                {/* Time */}
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDate(item.visited_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}