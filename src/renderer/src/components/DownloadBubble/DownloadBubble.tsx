import { useMemo } from 'react'
import { useDownload } from '../../context/DownloadContext'
import { useBrowser } from '../../context/BrowserContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../components/ui/dropdown-menu'
import { Download, Pause, Play, X, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const CircularProgress = ({ progress, size = 36 }: { progress: number; size?: number }) => {
  const radius = (size - 4) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary transition-all duration-300"
      />
    </svg>
  )
}

export default function DownloadBubble() {
  const { downloads, pauseDownload, resumeDownload, cancelDownload, deleteDownload } = useDownload()
  const { addTab } = useBrowser()

  const activeDownloads = downloads.filter((d) => d.state === 'progressing' || d.state === 'paused')
  const recentDownloads = downloads.slice(0, 5)

  const overallProgress = useMemo(() => {
    if (activeDownloads.length === 0) return 100
    const total = activeDownloads.reduce((sum, d) => sum + (d.total_bytes ?? 0), 0)
    const received = activeDownloads.reduce((sum, d) => sum + d.received_bytes, 0)
    if (total === 0) return 0
    return Math.round((received / total) * 100)
  }, [activeDownloads])

  if (downloads.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none"
          aria-label="Downloads"
        >
          {activeDownloads.length > 0 && (
            <CircularProgress progress={overallProgress} size={36} />
          )}
          <Download size={16} className="relative z-10" />
          {activeDownloads.length > 1 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium z-20">
              {activeDownloads.length}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent  align="end" className="w-80 p-2 bg-background border-none">
        <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">
          Downloads
        </div>

        <div className="space-y-1 max-h-72 overflow-y-auto">
          {recentDownloads.map((download) => {
            const progress =
              download.total_bytes && download.total_bytes > 0
                ? Math.round((download.received_bytes / download.total_bytes) * 100)
                : 0

            return (
              <div
                key={download.id}
                className="flex flex-col gap-1 px-2 py-2 rounded-md hover:bg-accent group"
              >
                <div className="flex items-center gap-2">
                  {/* State Icon */}
                  {download.state === 'completed' && (
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  )}
                  {download.state === 'interrupted' || download.state === 'cancelled' ? (
                    <AlertCircle size={14} className="text-destructive flex-shrink-0" />
                  ) : null}
                  {download.state === 'progressing' && (
                    <Download size={14} className="text-primary flex-shrink-0 animate-pulse" />
                  )}
                  {download.state === 'paused' && (
                    <Pause size={14} className="text-primary flex-shrink-0" />
                  )}

                  {/* Filename */}
                  <span className="text-sm font-medium truncate flex-1">
                    {download.filename}
                  </span>

                  {/* Controls */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {download.state === 'progressing' && (
              <>
                <button
                  onClick={() => pauseDownload(download.id)}
                  className="p-1 rounded hover:bg-muted"
                  title="Pause"
                >
                  <Pause size={12} />
                </button>
                <button
                  onClick={() => cancelDownload(download.id)}
                  className="p-1 rounded hover:bg-muted"
                  title="Cancel"
                >
                  <X size={12} />
                </button>
              </>
            )}
            {(download.state === 'paused' || download.state === 'interrupted') && (
              <button
                onClick={() => resumeDownload(download.id)}
                className="p-1 rounded hover:bg-muted"
                title="Resume"
              >
                <Play size={12} />
              </button>
            )}
            {/* Delete button for all downloads */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteDownload(download.id)
              }}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
              title="Remove"
            >
              <X size={12} />
            </button>
          </div>
                </div>

                {/* Progress Bar */}
                {(download.state === 'progressing' || download.state === 'paused') && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {formatBytes(download.received_bytes)}
                      {download.total_bytes ? ` / ${formatBytes(download.total_bytes)}` : ''}
                    </span>
                  </div>
                )}

                {download.state === 'completed' && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatBytes(download.received_bytes)}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <DropdownMenuSeparator className="my-2" />

        <button
          onClick={() => addTab('gaspra://downloads')}
          className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
        >
          <ExternalLink size={12} />
          Open Downloads Page
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}