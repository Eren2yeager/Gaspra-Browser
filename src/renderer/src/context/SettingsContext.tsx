import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Define the settings interface matching the backend
interface BrowserSettings {
  theme: 'light' | 'dark' | 'system'
  accentColor: 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'red' | 'cyan' | 'yellow'
  defaultSearchEngine: 'google' | 'bing' | 'duckduckgo' | 'yahoo'
  saveHistory: boolean
  saveDownloadHistory: boolean
  saveSearchHistory: boolean
  downloadPath: string
  askWhereToSave: boolean
  startupPage: 'newtab' | 'homepage' | 'continue'
  homepage: string
  blockPopups: boolean
  enableJavaScript: boolean
  enableImages: boolean
  saveTabsOnClose: boolean
  openNewTabPosition: 'end' | 'after current'
  warnOnCloseMultipleTabs: boolean
  hardwareAcceleration: boolean
  language: string
  backgroundType: 'none' | 'image' | 'video'
  backgroundPath: string | null
}

interface SettingsContextType {
  settings: BrowserSettings | null
  isLoading: boolean
  updateSetting: <K extends keyof BrowserSettings>(key: K, value: BrowserSettings[K]) => Promise<void>
  updateSettings: (partialSettings: Partial<BrowserSettings>) => Promise<void>
  resetSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | null>(null)

// Helper function to apply theme and accent color to the document
function applyThemeToDocument(theme: 'light' | 'dark' | 'system', accentColor: string) {
  const root = document.documentElement
  console.log('Applying theme:', theme, 'accent:', accentColor)

  // Remove all existing theme/accent classes
  root.classList.remove('light', 'dark')
  const accentClasses = Array.from(root.classList).filter(cls => cls.startsWith('theme-accent-'))
  root.classList.remove(...accentClasses)

  // Apply theme mode
  if (theme === 'light') {
    root.classList.add('light')
  } else if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'system') {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      root.classList.add('light')
    }
  }

  // Apply accent color
  if (accentColor) {
    const accentClass = `theme-accent-${accentColor}`
    root.classList.add(accentClass)
    console.log('Added accent class:', accentClass)
  }

  console.log('Current root classes:', root.classList)
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BrowserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Apply theme whenever settings change
  useEffect(() => {
    if (settings) {
      applyThemeToDocument(settings.theme, settings.accentColor)
    }
  }, [settings?.theme, settings?.accentColor])

  // Listen for system theme changes if using system mode
  useEffect(() => {
    if (settings?.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
      
      const handleSystemThemeChange = () => {
        applyThemeToDocument(settings.theme, settings.accentColor)
      }
      
      mediaQuery.addEventListener('change', handleSystemThemeChange)
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [settings?.theme, settings?.accentColor])

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const result = await window.browserAPI.getSettings()
      if (result.success && result.settings) {
        setSettings(result.settings)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateSetting = async <K extends keyof BrowserSettings>(key: K, value: BrowserSettings[K]) => {
    try {
      const result = await window.browserAPI.updateSetting(key, value)
      if (result.success) {
        setSettings(prev => prev ? { ...prev, [key]: value } : null)
      }
    } catch (error) {
      console.error('Failed to update setting:', error)
    }
  }

  const updateSettings = async (partialSettings: Partial<BrowserSettings>) => {
    try {
      const result = await window.browserAPI.updateSettings(partialSettings)
      if (result.success) {
        setSettings(prev => prev ? { ...prev, ...partialSettings } : null)
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  const resetSettings = async () => {
    try {
      const result = await window.browserAPI.resetSettings()
      if (result.success) {
        await loadSettings() // Reload settings after reset
      }
    } catch (error) {
      console.error('Failed to reset settings:', error)
    }
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSetting,
        updateSettings,
        resetSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within SettingsProvider')
  return context
}
