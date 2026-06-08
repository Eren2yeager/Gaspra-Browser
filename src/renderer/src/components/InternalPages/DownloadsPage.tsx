import { useState } from 'react'
import { useDownload } from '../../context/DownloadContext'
import { Download, Trash2, Search, Play, Pause, X, CheckCircle, AlertCircle, ExternalLink, FolderOpen } from 'lucide-react'

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}

export default function DownloadsPage() {
  const { downloads, clearDownloads, pauseDownload, resumeDownload, cancelDownload, deleteDownload } = useDownload()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDownloads = downloads.filter(
    (item) =>
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeDownloads = filteredDownloads.filter(d => d.state === 'progressing' || d.state === 'paused')
  const completedDownloads = filteredDownloads.filter(d => d.state === 'completed' || d.state === 'interrupted' || d.state === 'cancelled')

  const openFile = (savePath: string) => {
    window.browserAPI.openFile(savePath)
  }

  const showInFolder = (savePath: string) => {
    window.browserAPI.showInFolder(savePath)
  }

  return (
    <div className="w-full h-full flex flex-col p-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Download size={24} className="text-muted-foreground" />
          Downloads
        </h1>
        <button
          onClick={clearDownloads}
          disabled={downloads.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 size={16} />
          Clear All
        </button>
      </div>

      {/* Search */}
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
          className="w-full pl-9 pr-4 py-2 text-sm rounded-full   bg-muted placeholder:text-muted-foreground focus:outline-none focus:ring-[1px] focus:ring-white transition-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-8">
        {/* Active Downloads Section */}
        {activeDownloads.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-muted-foreground mb-4">Active Downloads</h2>
            <div className="space-y-2">
              {activeDownloads.map((download) => {
                const progress = download.total_bytes && download.total_bytes > 0
                  ? Math.round((download.received_bytes / download.total_bytes) * 100)
                  : 0

                return (
                  <div
                    key={download.id}
                    className="flex flex-col gap-3 p-4 rounded-lg bg-muted/20 border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
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
                        <div className="text-xs text-muted-foreground truncate">{download.url.replace(/^https?:\/\//, '')}</div>
                      </div>

                      <div className="flex items-center gap-1">
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
                        <button
                          onClick={() => deleteDownload(download.id)}
                          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {formatBytes(download.received_bytes)}{' '}
                        {download.total_bytes ? `/ ${formatBytes(download.total_bytes)}` : ''}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Completed Downloads Section */}
        {completedDownloads.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-muted-foreground mb-4">Completed</h2>
            <div className="space-y-2">
              {completedDownloads.map((download) => (
                <div
                  key={download.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/10 border border-border hover:bg-muted/20 transition-colors"
                >
                  {download.state === 'completed' && (
                    <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                  )}
                  {(download.state === 'interrupted' || download.state === 'cancelled') && (
                    <AlertCircle size={18} className="text-destructive flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{download.filename}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatBytes(download.received_bytes)} • {formatDate(download.started_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {download.state === 'completed' && (
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
                      onClick={() => deleteDownload(download.id)}
                      className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {filteredDownloads.length === 0 && (
          <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
            <Download size={48} className="mb-4 opacity-20" />
            <p>{searchQuery ? 'No downloads match your search.' : 'No downloads yet.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
