import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Download {
  id: string
  filename: string
  url: string
  save_path: string
  total_bytes: number | null
  received_bytes: number
  state: string
  started_at: string
}

interface DownloadContextType {
  downloads: Download[]
  clearDownloads: () => Promise<void>
  refreshDownloads: () => Promise<void>
  pauseDownload: (id: string) => Promise<void>
  resumeDownload: (id: string) => Promise<void>
  cancelDownload: (id: string) => Promise<void>
  deleteDownload: (id: string) => Promise<void>
}

const DownloadContext = createContext<DownloadContextType | null>(null)

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [downloads, setDownloads] = useState<Download[]>([])

  const refreshDownloads = async () => {
    try {
      const response = await window.browserAPI.getDownloads()
      if (response.success) {
        setDownloads(response.downloads as Download[] ?? [])
      }
    } catch (error) {
      console.error('Error fetching downloads:', error)
    }
  }

  const clearDownloads = async () => {
    try {
      const response = await window.browserAPI.clearDownloads()
      if (response.success) {
        setDownloads([])
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
      // Also remove from local state immediately for better UX!
      setDownloads(prev => prev.filter(d => d.id !== id))
    } catch (error) {
      console.error('Error deleting download:', error)
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
        state: data.state,
        started_at: new Date().toISOString()
      }
      setDownloads((prev) => [newDownload, ...prev])
    })

    const cleanupUpdated = window.browserAPI.onDownloadUpdated((data) => {
      setDownloads((prev) =>
        prev.map((download) =>
          download.id === data.id
            ? { 
                ...download, 
                received_bytes: data.receivedBytes, 
                total_bytes: data.totalBytes ?? download.total_bytes,
                state: data.state 
              }
            : download
        )
      )
    })

    const cleanupDone = window.browserAPI.onDownloadDone((data) => {
      setDownloads((prev) =>
        prev.map((download) =>
          download.id === data.id
            ? { 
                ...download, 
                received_bytes: data.receivedBytes, 
                total_bytes: data.totalBytes ?? download.total_bytes,
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
  }, [])

  return (
    <DownloadContext.Provider value={{ 
      downloads, 
      clearDownloads, 
      refreshDownloads,
      pauseDownload,
      resumeDownload,
      cancelDownload,
      deleteDownload
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
