import { BrowserWindow } from 'electron'
import { join } from 'path'
import icon from '../../../resources/icon.png?asset'
import { setupDownloadListeners } from './downloads'
import { registerWindowForTabs, setPendingWindowInit, type TabViewSnapshot } from './tabViews'

let downloadsWired = false

export type CreateWindowOptions = {
  x?: number
  y?: number
  width?: number
  height?: number
  pendingInit?: { tabs: TabViewSnapshot[]; activeTabId: number }
}

export function createWindow(options: CreateWindowOptions = {}): BrowserWindow {
  const windowIcon = process.platform === 'win32' ? join(process.cwd(), 'build', 'icon.ico') : icon

  const win = new BrowserWindow({
    width: options.width ?? 1380,
    height: options.height ?? 800,
    x: options.x,
    y: options.y,
    show: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' || process.platform === 'win32' ? { icon: windowIcon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  // ponytail: session listener once — multi-window shares defaultSession
  if (!downloadsWired) {
    setupDownloadListeners(win)
    downloadsWired = true
  }

  registerWindowForTabs(win)

  if (options.pendingInit) {
    setPendingWindowInit(win, options.pendingInit.tabs, options.pendingInit.activeTabId)
  }

  win.on('ready-to-show', () => {
    win.show()
  })

  const rendererUrl = process.env['ELECTRON_RENDERER_URL'] || process.env['VITE_DEV_SERVER_URL']
  if (rendererUrl) {
    win.loadURL(rendererUrl)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}
