import { useEffect } from 'react'
import { useBrowser } from '../context/BrowserContext'

/**
 * Custom hook that handles all keyboard shortcuts for the browser
 */
export function useKeyboardShortcuts() {
  const {
    tabs,
    activeTabId,
    addTab,
    closeTab,
    setActiveTab,
    goBack,
    goForward,
    reload,
    reloadIgnoringCache,
    stop
  } = useBrowser()

  const handleGlobalShortcut = ({ action }: { action: string }) => {
    switch (action) {
      case 'new-tab':
        addTab()
        break
      case 'close-tab':
        closeTab(activeTabId)
        break
      case 'next-tab': {
        const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId)
        const nextIndex = (currentIndex + 1) % tabs.length
        setActiveTab(tabs[nextIndex].id)
        break
      }
      case 'prev-tab': {
        const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId)
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length
        setActiveTab(tabs[prevIndex].id)
        break
      }
      case 'refresh':
        reload()
        break
      case 'hard-refresh':
        reloadIgnoringCache()
        break
      default:
        break
    }
  }

  const handleLocalKeydown = (e: KeyboardEvent) => {
    const isInputElement =
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target instanceof HTMLElement && e.target.isContentEditable)

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
      e.preventDefault()
      const urlBar = document.getElementById('url-bar') as HTMLInputElement
      if (urlBar) {
        urlBar.focus()
        urlBar.select()
      }
      return
    }

    if (e.key === 'Escape' && !isInputElement) {
      e.preventDefault()
      stop()
      return
    }

    if (e.altKey && e.key === 'ArrowLeft' && !isInputElement) {
      e.preventDefault()
      goBack()
      return
    }

    if (e.altKey && e.key === 'ArrowRight' && !isInputElement) {
      e.preventDefault()
      goForward()
      return
    }

    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && /^[1-9]$/.test(e.key)) {
      e.preventDefault()
      const tabIndex = parseInt(e.key) - 1
      if (tabs[tabIndex]) {
        setActiveTab(tabs[tabIndex].id)
      }
    }
  }

  useEffect(() => {
    const unsubscribeGlobal = window.browserAPI.onKeyboardShortcut(handleGlobalShortcut)
    window.addEventListener('keydown', handleLocalKeydown)

    return () => {
      unsubscribeGlobal()
      window.removeEventListener('keydown', handleLocalKeydown)
    }
  }, [tabs, activeTabId])
}
