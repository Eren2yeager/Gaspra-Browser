import { useState, useMemo } from 'react'
import { useDownload } from '../../context/DownloadContext'
import {
  Download,
  Trash2,
  Search,
  Play,
  Pause,
  X,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  FolderOpen,
  CheckSquare,
  Square
} from 'lucide-react'
import {AppIcon} from '../CustomIcons/AppIcon'
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const formatSpeed = (bytesPerSecond: number) => `${formatBytes(bytesPerSecond)}/s`

const formatRemainingTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Less than 1s left'

  const totalSeconds = Math.ceil(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  if (hours > 0) return `${hours}h ${minutes}m left`
  if (minutes > 0) return `${minutes}m ${secs}s left`
  return `${secs}s left`
}

const formatDateGroup = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

export default function DownloadsPage() {
  const {
    groupedDownloads,
    clearDownloads,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    deleteDownload
  } = useDownload()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)

  // Filter grouped downloads
  const filteredGroupedDownloads = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedDownloads
    }
    
    const query = searchQuery.toLowerCase()
    const result: Record<string, any[]> = {}
    
    for (const date in groupedDownloads) {
      const filteredItems = groupedDownloads[date].filter(
        (item) =>
          item.filename.toLowerCase().includes(query) ||
          item.url.toLowerCase().includes(query)
      )
      if (filteredItems.length > 0) {
        result[date] = filteredItems
      }
    }
    
    return result
  }, [groupedDownloads, searchQuery])

  const sortedDates = Object.keys(filteredGroupedDownloads).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  const hasDownloads = sortedDates.length > 0

  const openFile = (savePath: string) => {
    if (isSelectMode) return
    window.browserAPI.openFile(savePath)
  }

  const showInFolder = (savePath: string) => {
    if (isSelectMode) return
    window.browserAPI.showInFolder(savePath)
  }

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteDownload(id)
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  const toggleSelectItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectDateGroup = (items: any[]) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      const allSelected = items.every(item => newSet.has(item.id))
      
      if (allSelected) {
        items.forEach(item => newSet.delete(item.id))
      } else {
        items.forEach(item => newSet.add(item.id))
      }
      
      return newSet
    })
  }

  const selectAll = () => {
    const allIds: string[] = []
    for (const date in filteredGroupedDownloads) {
      filteredGroupedDownloads[date].forEach((item: any) => allIds.push(item.id))
    }
    setSelectedItems(new Set(allIds))
  }

  const deselectAll = () => {
    setSelectedItems(new Set())
  }

  const deleteSelected = async () => {
    if (confirm(`Delete ${selectedItems.size} selected items?`)) {
      for (const id of selectedItems) {
        await deleteDownload(id)
      }
      setSelectedItems(new Set())
      setIsSelectMode(false)
    }
  }

  const deleteDateGroup = (e: React.MouseEvent, items: any[]) => {
    e.stopPropagation()
    if (confirm(`Delete ${items.length} items from this date?`)) {
      items.forEach(item => deleteDownload(item.id))
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-6 bg-background text-foreground">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl align-center font-semibold flex items-center gap-2">
            <AppIcon size={50} className="text-muted-foreground pt-0.5 grayscale" />
            Downloads
          </h1>
          {isSelectMode && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedItems.size} selected
              </span>
              <button
                onClick={deselectAll}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Deselect all
              </button>
              <button
                onClick={deleteSelected}
                disabled={selectedItems.size === 0}
                className="
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                  bg-destructive/70 hover:bg-destructive
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                <Trash2 size={14} />
                Delete selected
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isSelectMode && hasDownloads && (
            <>
              <button
                onClick={() => {
                  setIsSelectMode(true)
                  selectAll()
                }}
                className="
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                  bg-accent text-accent-foreground hover:bg-accent/80
                  transition-colors
                "
              >
                <CheckSquare size={14} />
                Select
              </button>
              <button
                onClick={clearDownloads}
                className="
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                  bg-destructive/70 hover:bg-destructive
                  transition-colors
                "
              >
                <Trash2 size={14} />
                Clear All
              </button>
            </>
          )}
          {isSelectMode && (
            <button
              onClick={() => {
                setIsSelectMode(false)
                deselectAll()
              }}
              className="
                px-3 py-1.5 rounded-md text-sm font-medium
                bg-accent text-accent-foreground hover:bg-accent/80
                transition-colors
              "
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search downloads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-full
                border border-input bg-muted
                focus:outline-none focus:ring-2 focus:ring-ring
                placeholder:text-muted-foreground transition-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {!hasDownloads ? (
          <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
            <Download size={48} className="mb-4 opacity-20" />
            <p>{searchQuery ? 'No downloads match your search.' : 'No downloads yet.'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => {
              // Separate active and completed downloads for this date
              const dateDownloads = filteredGroupedDownloads[date]
              const activeDownloads = dateDownloads.filter(
                (d) => d.state === 'progressing' || d.state === 'paused'
              )
              const completedDownloads = dateDownloads.filter(
                (d) => d.state === 'completed' || d.state === 'interrupted' || d.state === 'cancelled'
              )
              const allSelectedForDate = dateDownloads.every(item => selectedItems.has(item.id))

              return (
                <div key={date}>
                  {/* Date Header with Group Select/Delete */}
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h2 
                      className="text-sm font-semibold text-muted-foreground cursor-pointer flex items-center gap-2"
                      onClick={() => toggleSelectDateGroup(dateDownloads)}
                    >
                      {isSelectMode && (
                        <button className="text-muted-foreground hover:text-foreground">
                          {allSelectedForDate ? <CheckSquare size={14} /> : <Square size={14} />}
                        </button>
                      )}
                      {formatDateGroup(date)}
                    </h2>
                    {isSelectMode && (
                      <button
                        onClick={(e) => deleteDateGroup(e, dateDownloads)}
                        className="
                          text-xs px-2 py-1 rounded-md
                          bg-destructive/70 hover:bg-destructive
                          transition-colors
                        "
                      >
                        Delete all
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Active Downloads for this date */}
                    {activeDownloads.length > 0 && (
                      <div className="space-y-2">
                        {activeDownloads.map((download) => {
                          const progress =
                            download.total_bytes && download.total_bytes > 0
                              ? Math.round((download.received_bytes / download.total_bytes) * 100)
                              : 0
                          const remainingBytes =
                            download.total_bytes && download.total_bytes > 0
                              ? Math.max(download.total_bytes - download.received_bytes, 0)
                              : null
                          const remainingTime =
                            download.state === 'progressing' &&
                            remainingBytes !== null &&
                            download.bytes_per_second > 0
                              ? formatRemainingTime(remainingBytes / download.bytes_per_second)
                              : null
                          const progressDetails = `${formatBytes(download.received_bytes)}${
                            download.total_bytes ? ` / ${formatBytes(download.total_bytes)}` : ''
                          }`
                          const transferMeta =
                            download.state === 'progressing'
                              ? [formatSpeed(download.bytes_per_second), remainingTime]
                                  .filter(Boolean)
                                  .join(' • ')
                              : 'Paused'

                          return (
                            <div
                              key={download.id}
                              className={`
                                flex flex-col gap-3 p-4 rounded-lg border
                                transition-colors
                                ${selectedItems.has(download.id) 
                                  ? 'bg-accent border-accent' 
                                  : 'bg-muted/20 border-border hover:bg-muted/30'
                                }
                              `}
                            >
                              <div className="flex items-center gap-3">
                                {/* Checkbox for select mode */}
                                {isSelectMode && (
                                  <button
                                    onClick={(e) => toggleSelectItem(e, download.id)}
                                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                                  >
                                    {selectedItems.has(download.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                                  </button>
                                )}

                                {download.state === 'progressing' && (
                                  <Download size={18} className="text-primary flex-shrink-0" />
                                )}
                                {download.state === 'paused' && (
                                  <Pause size={18} className="text-yellow-500 flex-shrink-0" />
                                )}
                                {download.state === 'interrupted' && (
                                  <AlertCircle size={18} className="text-destructive flex-shrink-0" />
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{download.filename}</div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {download.url.replace(/^https?:\/\//, '')}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(download.started_at)}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {!isSelectMode && (
                                      <>
                                        {download.state === 'progressing' && (
                                          <>
                                            <button
                                              onClick={() => pauseDownload(download.id)}
                                              className="p-2 rounded-md hover:bg-muted"
                                              title="Pause"
                                            >
                                              <Pause size={14} />
                                            </button>
                                            <button
                                              onClick={() => cancelDownload(download.id)}
                                              className="p-2 rounded-md hover:bg-muted"
                                              title="Cancel"
                                            >
                                              <X size={14} />
                                            </button>
                                          </>
                                        )}
                                        {(download.state === 'paused' || download.state === 'interrupted') && (
                                          <button
                                            onClick={() => resumeDownload(download.id)}
                                            className="p-2 rounded-md hover:bg-muted"
                                            title="Resume"
                                          >
                                            <Play size={14} />
                                          </button>
                                        )}
                                      </>
                                    )}
                                    <button
                                      onClick={(e) => handleDeleteItem(e, download.id)}
                                      className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
                                      title="Remove"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-xs text-muted-foreground font-mono">
                                      {progressDetails}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground/80">
                                      {transferMeta}
                                    </div>
                                  </div>
                                  <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                                    {progress}%
                                  </span>
                                </div>

                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Completed Downloads for this date */}
                    {completedDownloads.length > 0 && (
                      <div className="space-y-2">
                        {completedDownloads.map((download) => (
                          <div
                            key={download.id}
                            className={`
                              flex items-center gap-4 p-4 rounded-lg border
                              transition-colors
                              ${selectedItems.has(download.id) 
                                ? 'bg-accent border-accent' 
                                : 'bg-muted/10 border-border hover:bg-muted/20'
                              }
                            `}
                          >
                            {/* Checkbox for select mode */}
                            {isSelectMode && (
                              <button
                                onClick={(e) => toggleSelectItem(e, download.id)}
                                className="text-muted-foreground hover:text-foreground flex-shrink-0"
                              >
                                {selectedItems.has(download.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                              </button>
                            )}

                            {download.state === 'completed' && (
                              <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                            )}
                            {(download.state === 'interrupted' || download.state === 'cancelled') && (
                              <AlertCircle size={18} className="text-destructive flex-shrink-0" />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{download.filename}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatBytes(download.received_bytes)}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(download.started_at)}
                              </span>
                              <div className="flex items-center gap-1">
                                {!isSelectMode && download.state === 'completed' && (
                                  <>
                                    <button
                                      onClick={() => openFile(download.save_path)}
                                      className="p-2 rounded-md hover:bg-muted"
                                      title="Open File"
                                    >
                                      <ExternalLink size={14} />
                                    </button>
                                    <button
                                      onClick={() => showInFolder(download.save_path)}
                                      className="p-2 rounded-md hover:bg-muted"
                                      title="Show in Folder"
                                    >
                                      <FolderOpen size={14} />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={(e) => handleDeleteItem(e, download.id)}
                                  className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
                                  title="Remove"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
