import { useEffect, useState } from 'react'
import { Minus, Square, X } from 'lucide-react'

const WindowControls = () => {
  const [isMaximized, setIsMaximized] = useState(false)
  const isWindows = navigator.userAgent.includes('Windows')

  const refreshIsMaximized = async () => {
    const response = await window.browserAPI.isWindowMaximized()
    if (response.success) {
      setIsMaximized(!!response.isMaximized)
    }
  }

  useEffect(() => {
    refreshIsMaximized()
  }, [])

  const handleMinimize = async () => {
    await window.browserAPI.minimizeWindow()
  }

  const handleToggleMaximize = async () => {
    const response = await window.browserAPI.toggleMaximizeWindow()
    if (response.success) {
      setIsMaximized(!!response.isMaximized)
    } else {
    }
  }

  const handleClose = async () => {
    await window.browserAPI.closeWindow()
  }
  // if (isWindows) {
  //   return <div className="w-[138px] h-full bg-background shrink-0 pointer-events-none" aria-hidden="true" />
  // }

  return (
    <div className="flex items-stretch h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
      <button
        type="button"
        onClick={handleMinimize}
        className="w-12 h-full flex items-center  justify-center text-muted-foreground hover:bg-primary/10 hover:text-foreground  transition-colors"
        aria-label="Minimize"
        title="Minimize"
      >
        <Minus size={16} />
      </button>

      <button
        type="button"
        onClick={handleToggleMaximize}
        className="w-12 h-full flex items-center  justify-center text-muted-foreground hover:bg-primary/10 hover:text-foreground  transition-colors"
        aria-label={isMaximized ? 'Restore' : 'Maximize'}
        title={isMaximized ? 'Restore' : 'Maximize'}
      >
        <Square size={14} />
      </button>

      <button
        type="button"
        onClick={handleClose}
        className="w-12 h-full flex items-center  justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:bg-red-700 transition-colors"
        aria-label="Close"
        title="Close"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default WindowControls
