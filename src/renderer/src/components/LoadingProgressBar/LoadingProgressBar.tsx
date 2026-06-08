import { JSX, useMemo } from 'react'
import { useBrowser } from '../../context/BrowserContext'
import { cn } from '../../lib/utils'

const LoadingProgressBar = () : JSX.Element => {
  const { tabs, activeTabId } = useBrowser()

  const isLoading = useMemo(() => {
    const tab = tabs.find((t) => t.id === activeTabId)
    return !!tab?.isLoading
  }, [tabs, activeTabId])

  return (
    <div
      className={cn('w-full h-0.5 overflow-hidden', isLoading ? 'bg-blue-500/15' : 'bg-transparent')}
    >
      {isLoading ? <div className="h-full w-1/3 bg-blue-500 gaspra-progress-indicator" /> : null}
    </div>
  )
}

export default LoadingProgressBar
