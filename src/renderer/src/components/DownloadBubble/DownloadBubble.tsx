import { useMemo, useState } from 'react'
import { useDownload } from '../../context/DownloadContext'
import { useBrowser } from '../../context/BrowserContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../components/ui/dropdown-menu'
import {
  Download,
  Pause,
  Play,
  X,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Trash2
} from 'lucide-react'

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
  const minutes = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60

  if (minutes > 0) return `${minutes}m ${secs}s left`
  return `${secs}s left`
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
        className="text-muted"
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
  const { downloads, pauseDownload, resumeDownload, cancelDownload, deleteDownload } =
    useDownload()
  const { addTab } = useBrowser()
  const [menuOpen, setMenuOpen] = useState(false)

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
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors focus-visible:outline-none"
          aria-label="Downloads"
        >
          {activeDownloads.length > 0 && <CircularProgress progress={overallProgress} size={36} />}
          <Download size={16} className="relative z-10" />
          { activeDownloads.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium z-20">
            { activeDownloads.length}
          </span>
        )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-2 border-none">
        <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">
          Downloads
        </div>

        <div className="space-y-1 max-h-72 overflow-y-auto">
          {recentDownloads.map((download) => {
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
                : download.state === 'paused'
                  ? 'Paused'
                  : ''

            return (
              <div
                key={download.id}
                className="flex flex-col gap-1 px-2 py-2 rounded-md hover:bg-accent group"
              >
                <div className="flex items-center gap-2">
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

                  <span className="text-sm font-medium truncate flex-1">{download.filename}</span>

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
                    {(download.state === 'completed' || download.state === 'cancelled') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteDownload(download.id)
                        }}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                        title="Remove"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {(download.state === 'progressing' || download.state === 'paused') && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {progressDetails}
                        </div>
                        {transferMeta && (
                          <div className="text-[10px] text-muted-foreground/80 truncate">
                            {transferMeta}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {progress}%f
                      </span>
                    </div>

                    <div className="h-1 rounded-full bg-background/30 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
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
