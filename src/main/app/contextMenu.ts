import { BrowserWindow, clipboard, Menu, MenuItem } from 'electron'

export function createContextMenu(event: Electron.IpcMainEvent | { sender: any }, params: any) {
  const menu = new Menu()
  const win = BrowserWindow.fromWebContents(event.sender)

  if (params.linkURL) {
    menu.append(
      new MenuItem({
        label: 'Open Link in New Tab',
        click: () => {
          win?.webContents.send('open-link-in-new-tab', params.linkURL)
        }
      })
    )
    menu.append(
      new MenuItem({
        label: 'Copy Link Address',
        click: async () => {
          await clipboard.writeText(params.linkURL)
        }
      })
    )
    menu.append(new MenuItem({ type: 'separator' }))
  }

  const mediaUrl = params.mediaURL || params.srcURL
  if (mediaUrl && params.mediaType === 'image') {
    menu.append(
      new MenuItem({
        label: 'Open Image in New Tab',
        click: () => {
          win?.webContents.send('open-link-in-new-tab', mediaUrl)
        }
      })
    )
    menu.append(
      new MenuItem({
        label: 'Save Image As...',
        click: () => {
          event.sender.downloadURL(mediaUrl)
        }
      })
    )
    menu.append(new MenuItem({ type: 'separator' }))
  }

  if (params.hasSelectionText) {
    menu.append(
      new MenuItem({
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        click: async () => {
          await clipboard.writeText(params.selectionText)
        }
      })
    )
    menu.append(new MenuItem({ type: 'separator' }))
  }

  menu.append(
    new MenuItem({
      label: 'Back',
      accelerator: 'CmdOrCtrl+[',
      enabled: params.canGoBack,
      click: () => {
        event.sender.goBack()
      }
    })
  )
  menu.append(
    new MenuItem({
      label: 'Forward',
      accelerator: 'CmdOrCtrl+]',
      enabled: params.canGoForward,
      click: () => {
        event.sender.goForward()
      }
    })
  )
  menu.append(
    new MenuItem({
      label: 'Reload',
      accelerator: 'CmdOrCtrl+R',
      click: () => {
        event.sender.reload()
      }
    })
  )
  menu.append(new MenuItem({ type: 'separator' }))
  menu.append(
    new MenuItem({
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      click: () => {
        event.sender.selectAll()
      }
    })
  )

  if (process.env.NODE_ENV === 'development') {
    menu.append(new MenuItem({ type: 'separator' }))
    menu.append(
      new MenuItem({
        label: 'Inspect Element',
        accelerator: 'CmdOrCtrl+Shift+I',
        click: () => {
          event.sender.inspectElement(params.x, params.y)
        }
      })
    )
    menu.append(
      new MenuItem({
        label: 'Open DevTools',
        click: () => {
          event.sender.openDevTools()
        }
      })
    )
  }

  menu.popup({ window: win! })
}

export function createInternalPageContextMenu(event: Electron.IpcMainEvent) {
  const menu = new Menu()

  menu.append(
    new MenuItem({
      label: 'Cut',
      accelerator: 'CmdOrCtrl+X',
      click: () => {
        event.sender.cut()
      }
    })
  )
  menu.append(
    new MenuItem({
      label: 'Copy',
      accelerator: 'CmdOrCtrl+C',
      click: () => {
        event.sender.copy()
      }
    })
  )
  menu.append(
    new MenuItem({
      label: 'Paste',
      accelerator: 'CmdOrCtrl+V',
      click: () => {
        event.sender.paste()
      }
    })
  )
  menu.append(new MenuItem({ type: 'separator' }))
  menu.append(
    new MenuItem({
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      click: () => {
        event.sender.selectAll()
      }
    })
  )

  if (process.env.NODE_ENV === 'development') {
    menu.append(new MenuItem({ type: 'separator' }))
    menu.append(
      new MenuItem({
        label: 'Open DevTools',
        click: () => {
          event.sender.openDevTools()
        }
      })
    )
  }

  menu.popup({ window: BrowserWindow.fromWebContents(event.sender)! })
}
