import { BrowserWindow, Menu, MenuItem } from 'electron'

export type BrowserMenuState = {
  isSidebarOpen: boolean
  isBookmarked: boolean
  defaultSearchEngine: string
  saveHistory: boolean
  saveSearchHistory: boolean
  saveDownloadHistory: boolean
  askWhereToSave: boolean
  saveTabsOnClose: boolean
  blockPopups: boolean
  enableJavaScript: boolean
  enableImages: boolean
  hardwareAcceleration: boolean
}

function send(win: BrowserWindow | null, action: string, value?: unknown): void {
  win?.webContents.send('browser-menu-action', { action, value })
}

/** Native menu so it paints above WebContentsView (Chrome-like, no blanking page). */
export function createBrowserMenu(event: Electron.IpcMainEvent, state: BrowserMenuState): void {
  const win = BrowserWindow.fromWebContents(event.sender)
  const menu = new Menu()

  menu.append(
    new MenuItem({
      label: 'New tab',
      accelerator: 'CmdOrCtrl+T',
      click: () => send(win, 'new-tab')
    })
  )
  menu.append(new MenuItem({ label: 'Go to homepage', click: () => send(win, 'home') }))
  menu.append(new MenuItem({ label: 'Downloads', click: () => send(win, 'open-downloads') }))
  menu.append(new MenuItem({ label: 'History', click: () => send(win, 'open-history') }))
  menu.append(new MenuItem({ label: 'Settings', click: () => send(win, 'open-settings') }))
  menu.append(new MenuItem({ type: 'separator' }))

  menu.append(
    new MenuItem({
      label: 'Show bookmarks sidebar',
      type: 'checkbox',
      checked: state.isSidebarOpen,
      click: (item) => send(win, 'toggle-sidebar', item.checked)
    })
  )
  menu.append(
    new MenuItem({
      label: 'Bookmark this page',
      type: 'checkbox',
      checked: state.isBookmarked,
      click: () => send(win, 'toggle-bookmark')
    })
  )
  menu.append(new MenuItem({ type: 'separator' }))

  const searchSub = new Menu()
  for (const engine of ['google', 'bing', 'duckduckgo', 'yahoo'] as const) {
    searchSub.append(
      new MenuItem({
        label: engine.charAt(0).toUpperCase() + engine.slice(1),
        type: 'radio',
        checked: state.defaultSearchEngine === engine,
        click: () => send(win, 'set-search-engine', engine)
      })
    )
  }
  menu.append(new MenuItem({ label: 'Search engine', submenu: searchSub }))

  const quickSub = new Menu()
  const toggles: Array<{ label: string; key: keyof BrowserMenuState; action: string }> = [
    { label: 'Save browsing history', key: 'saveHistory', action: 'set-save-history' },
    { label: 'Save search history', key: 'saveSearchHistory', action: 'set-save-search-history' },
    {
      label: 'Save download history',
      key: 'saveDownloadHistory',
      action: 'set-save-download-history'
    },
    { label: 'Ask where to save files', key: 'askWhereToSave', action: 'set-ask-where-to-save' },
    { label: 'Restore tabs on reopen', key: 'saveTabsOnClose', action: 'set-save-tabs-on-close' },
    { label: 'Block popups', key: 'blockPopups', action: 'set-block-popups' },
    { label: 'Enable JavaScript', key: 'enableJavaScript', action: 'set-enable-javascript' },
    { label: 'Load images', key: 'enableImages', action: 'set-enable-images' },
    {
      label: 'Hardware acceleration',
      key: 'hardwareAcceleration',
      action: 'set-hardware-acceleration'
    }
  ]
  for (const t of toggles) {
    quickSub.append(
      new MenuItem({
        label: t.label,
        type: 'checkbox',
        checked: Boolean(state[t.key]),
        click: (item) => send(win, t.action, item.checked)
      })
    )
  }
  menu.append(new MenuItem({ label: 'Quick settings', submenu: quickSub }))
  menu.append(new MenuItem({ type: 'separator' }))

  const clearSub = new Menu()
  clearSub.append(new MenuItem({ label: 'Clear history', click: () => send(win, 'clear-history') }))
  clearSub.append(
    new MenuItem({ label: 'Clear search history', click: () => send(win, 'clear-search-history') })
  )
  clearSub.append(
    new MenuItem({
      label: 'Clear download history',
      click: () => send(win, 'clear-download-history')
    })
  )
  menu.append(new MenuItem({ label: 'Clear browsing data', submenu: clearSub }))
  menu.append(new MenuItem({ label: 'Reset all settings', click: () => send(win, 'reset-settings') }))

  menu.popup({ window: win ?? undefined })
}
