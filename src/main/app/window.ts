import { BrowserWindow } from 'electron'
import { join } from 'path'
import icon from '../../../resources/icon.png?asset'
import { setupDownloadListeners } from './downloads'

export function createWindow(): BrowserWindow {
  const windowIcon = process.platform === 'win32' ? join(process.cwd(), 'build', 'icon.ico') : icon

  const win = new BrowserWindow({
    width: 1380,
    height: 800,
    show: false,
    titleBarStyle: 'hidden',
    // ...(process.platform === 'win32'
    //   ? {
    //       titleBarOverlay: {
    //         color: '#02050D',
    //         symbolColor: '#d4d4d8',
    //         height: 40
    //       }
    //     }
    //   : {}),
    autoHideMenuBar: true,
    ...(process.platform === 'linux' || process.platform === 'win32' ? { icon: windowIcon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true,
      webSecurity: false,
      // allowFileAccessFromFiles: true
    }
  })

  setupDownloadListeners(win)

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
