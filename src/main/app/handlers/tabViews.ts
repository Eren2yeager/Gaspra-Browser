import { BrowserWindow, ipcMain } from 'electron'
import {
  attachTabToWindow,
  consumePendingWindowInit,
  destroyTabView,
  ensureTabView,
  getTabWindow,
  goBack,
  goForward,
  navigateTabView,
  reload,
  reloadIgnoringCache,
  setWindowOccluded,
  setActiveTabView,
  setContentBounds,
  snapshotTab,
  stop,
  type TabViewSnapshot
} from '../tabViews'
import { createWindow } from '../window'

function winFromEvent(event: Electron.IpcMainInvokeEvent | Electron.IpcMainEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender)
}

export function registerTabViewHandlers(): void {
  ipcMain.handle('tab-view-get-init', (event) => {
    const win = winFromEvent(event)
    if (!win) return { success: false }
    const pending = consumePendingWindowInit(win)
    return { success: true, init: pending, skipRestore: pending != null }
  })

  ipcMain.handle('tab-view-set-occluded', (event, occluded: boolean) => {
    const win = winFromEvent(event)
    if (!win) return { success: false }
    setWindowOccluded(win, occluded)
    return { success: true }
  })

  ipcMain.handle('tab-view-set-bounds', (event, bounds) => {
    const win = winFromEvent(event)
    if (!win) return { success: false }
    setContentBounds(win, bounds)
    return { success: true }
  })

  ipcMain.handle('tab-view-ensure', (event, tabId: number, url: string) => {
    const win = winFromEvent(event)
    if (!win) return { success: false }
    ensureTabView(win, tabId, url)
    return { success: true }
  })

  ipcMain.handle('tab-view-destroy', (_event, tabId: number) => {
    destroyTabView(tabId)
    return { success: true }
  })

  ipcMain.handle('tab-view-set-active', (event, tabId: number | null) => {
    const win = winFromEvent(event)
    if (!win) return { success: false }
    setActiveTabView(win, tabId)
    return { success: true }
  })

  ipcMain.handle('tab-view-navigate', (event, tabId: number, url: string) => {
    const win = winFromEvent(event)
    if (!win) return { success: false }
    navigateTabView(win, tabId, url)
    return { success: true }
  })

  ipcMain.handle('tab-view-go-back', (_event, tabId: number) => {
    goBack(tabId)
    return { success: true }
  })

  ipcMain.handle('tab-view-go-forward', (_event, tabId: number) => {
    goForward(tabId)
    return { success: true }
  })

  ipcMain.handle('tab-view-reload', (_event, tabId: number) => {
    reload(tabId)
    return { success: true }
  })

  ipcMain.handle('tab-view-reload-ignoring-cache', (_event, tabId: number) => {
    reloadIgnoringCache(tabId)
    return { success: true }
  })

  ipcMain.handle('tab-view-stop', (_event, tabId: number) => {
    stop(tabId)
    return { success: true }
  })

  ipcMain.handle(
    'tab-view-tear-off',
    (
      event,
      payload: { tabId: number; tab: TabViewSnapshot; screenX: number; screenY: number }
    ) => {
      const { tabId, tab, screenX, screenY } = payload
      const oldWin = getTabWindow(tabId) ?? winFromEvent(event)
      if (!oldWin) return { success: false }

      const isInternal = tab.url.startsWith('gaspra://')

      const pointInside = (win: BrowserWindow) => {
        try {
          const b = win.getBounds()
          return (
            screenX >= b.x &&
            screenX <= b.x + b.width &&
            screenY >= b.y &&
            screenY <= b.y + b.height
          )
        } catch {
          return false
        }
      }

      // Prefer focused window if the drop point hits it.
      const focused = BrowserWindow.getFocusedWindow()
      let targetWin: BrowserWindow | null = null
      if (focused && focused.id !== oldWin.id && pointInside(focused)) {
        targetWin = focused
      } else {
        const candidates = BrowserWindow.getAllWindows().filter(
          (w) => w.id !== oldWin.id && !w.isDestroyed()
        )
        targetWin = candidates.find((w) => pointInside(w)) ?? null
      }

      // Always compute snapshot for UI state on the target.
      const snap = snapshotTab(tabId) ?? tab

      if (targetWin) {
        // Cross-window attach: move WebContentsView if it exists, otherwise just move state.
        if (!isInternal) {
          attachTabToWindow(tabId, targetWin)
          setActiveTabView(targetWin, tabId)
        }

        targetWin.webContents.send('tab-view-attached', { tabId, tab: snap })
        oldWin.webContents.send('tab-view-detached', { tabId })

        return { success: true, mode: 'attach', targetWindowId: targetWin.id }
      }

      // No target window under the cursor: create a new one with just this tab.
      const newWin = createWindow({
        x: Math.round(screenX - 100),
        y: Math.round(screenY - 20),
        pendingInit: { tabs: [snap], activeTabId: tabId }
      })

      if (!isInternal) {
        attachTabToWindow(tabId, newWin)
        setActiveTabView(newWin, tabId)
      }

      oldWin.webContents.send('tab-view-detached', { tabId })

      return { success: true, mode: 'new', targetWindowId: newWin.id }
    }
  )
}
