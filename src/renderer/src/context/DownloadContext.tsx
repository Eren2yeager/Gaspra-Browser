import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

interface Download {
  id: string
  filename: string
  url: string
  save_path: string
  total_bytes: number | null
  received_bytes: number
  bytes_per_second: number
  state: string
  started_at: string
}

interface DownloadContextType {
  downloads: Download[]
  groupedDownloads: Record<string, Download[]>
  clearDownloads: () => Promise<void>
  refreshDownloads: () => Promise<void>
  pauseDownload: (id: string) => Promise<void>
  resumeDownload: (id: string) => Promise<void>
  cancelDownload: (id: string) => Promise<void>
  deleteDownload: (id: string) => Promise<void>
  searchDownloads: (query: string) => Promise<Download[]>
}

// Helper function to group downloads by date
const groupDownloadsByDate = (downloads: Download[]): Record<string, Download[]> => {
  const grouped: Record<string, Download[]> = {}
  downloads.forEach(download => {
    const date = new Date(download.started_at).toDateString()
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(download)
  })
  return grouped
}

const DownloadContext = createContext<DownloadContextType | null>(null)

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [downloads, setDownloads] = useState<Download[]>([])
  const [groupedDownloads, setGroupedDownloads] = useState<Record<string, Download[]>>({})

  const updateDownloadsAndGrouped = useCallback((newDownloads: Download[] | ((prev: Download[]) => Download[])) => {
    setDownloads((prev) => {
      const updatedDownloads = typeof newDownloads === 'function' 
        ? newDownloads(prev) 
        : newDownloads
      setGroupedDownloads(groupDownloadsByDate(updatedDownloads))
      return updatedDownloads
    })
  }, [])

  const refreshDownloads = async () => {
    try {
      const response = await window.browserAPI.getDownloads()
      if (response.success) {
        const fetchedDownloads = response.downloads as Download[] ?? []
        updateDownloadsAndGrouped(fetchedDownloads)
      }
    } catch (error) {
      console.error('Error fetching downloads:', error)
    }
  }

  const clearDownloads = async () => {
    try {
      const response = await window.browserAPI.clearDownloads()
      if (response.success) {
        updateDownloadsAndGrouped([])
      }
    } catch (error) {
      console.error('Error clearing downloads:', error)
    }
  }

  const pauseDownload = async (id: string) => {
    try {
      await window.browserAPI.pauseDownload(id)
    } catch (error) {
      console.error('Error pausing download:', error)
    }
  }

  const resumeDownload = async (id: string) => {
    try {
      await window.browserAPI.resumeDownload(id)
    } catch (error) {
      console.error('Error resuming download:', error)
    }
  }

  const cancelDownload = async (id: string) => {
    try {
      await window.browserAPI.cancelDownload(id)
    } catch (error) {
      console.error('Error cancelling download:', error)
    }
  }

  const deleteDownload = async (id: string) => {
    try {
      await window.browserAPI.deleteDownload(id)
      // Update locally immediately
      updateDownloadsAndGrouped((prev) => prev.filter(d => d.id !== id))
    } catch (error) {
      console.error('Error deleting download:', error)
    }
  }

  const searchDownloads = async (query: string): Promise<Download[]> => {
    if (!query.trim()) return []
    try {
      const response = await window.browserAPI.searchDownloads(query)
      if (response.success) {
        return response.results as Download[] ?? []
      }
      return []
    } catch (error) {
      console.error('Error searching downloads:', error)
      return []
    }
  }

  useEffect(() => {
    // Load existing downloads on startup
    refreshDownloads()

    // Listen to download events
    const cleanupStarted = window.browserAPI.onDownloadStarted((data) => {
      const newDownload: Download = {
        id: data.id,
        filename: data.filename,
        url: data.url,
        save_path: data.savePath,
        total_bytes: data.totalBytes,
        received_bytes: data.receivedBytes,
        bytes_per_second: data.bytesPerSecond ?? 0,
        state: data.state,
        started_at: new Date().toISOString()
      }
      updateDownloadsAndGrouped((prev) => [newDownload, ...prev])
    })

    const cleanupUpdated = window.browserAPI.onDownloadUpdated((data) => {
      updateDownloadsAndGrouped((prev) =>
        prev.map((download) =>
          download.id === data.id
            ? { 
                ...download, 
                received_bytes: data.receivedBytes, 
                total_bytes: data.totalBytes ?? download.total_bytes,
                bytes_per_second: data.bytesPerSecond ?? 0,
                state: data.state 
              }
            : download
        )
      )
    })

    const cleanupDone = window.browserAPI.onDownloadDone((data) => {
      updateDownloadsAndGrouped((prev) =>
        prev.map((download) =>
          download.id === data.id
            ? { 
                ...download, 
                received_bytes: data.receivedBytes, 
                total_bytes: data.totalBytes ?? download.total_bytes,
                bytes_per_second: data.bytesPerSecond ?? 0,
                state: data.state 
              }
            : download
        )
      )
    })

    // Cleanup listeners on unmount
    return () => {
      cleanupStarted()
      cleanupUpdated()
      cleanupDone()
    }
  }, [updateDownloadsAndGrouped])

  return (
    <DownloadContext.Provider value={{ 
      downloads, 
      groupedDownloads,
      clearDownloads, 
      refreshDownloads,
      pauseDownload,
      resumeDownload,
      cancelDownload,
      deleteDownload,
      searchDownloads
    }}>
      {children}
    </DownloadContext.Provider>
  )
}

export function useDownload() {
  const context = useContext(DownloadContext)
  if (!context) throw new Error('useDownload must be used within a DownloadProvider')
  return context
}
