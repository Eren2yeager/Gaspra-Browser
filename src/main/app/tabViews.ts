import { BrowserWindow, WebContentsView, Rectangle } from 'electron'
import { dbOperations } from '../db'
import { createContextMenu } from './contextMenu'

export type TabViewSnapshot = {
  id: number
  title: string
  url: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
}

type TabEntry = {
  tabId: number
  view: WebContentsView
  window: BrowserWindow
  lastRequestedUrl: string
}

type WindowState = {
  contentBounds: Rectangle
  activeTabId: number | null
  occluded: boolean
}

const tabEntries = new Map<number, TabEntry>()
const windowStates = new Map<number, WindowState>()
/** Seed tabs for a newly created window (tear-off). */
const pendingWindowInit = new Map<number, { tabs: TabViewSnapshot[]; activeTabId: number }>()
const pendingWindowInitDeleteScheduled = new Set<number>()

const HIDDEN_BOUNDS: Rectangle = { x: 0, y: 0, width: 0, height: 0 }

function getWindowState(win: BrowserWindow): WindowState {
  let state = windowStates.get(win.id)
  if (!state) {
    state = {
      contentBounds: { x: 0, y: 0, width: 0, height: 0 },
      activeTabId: null,
      occluded: false
    }
    windowStates.set(win.id, state)
  }
  return state
}

function isInternalUrl(url: string): boolean {
  return url.startsWith('gaspra://')
}

function sendTabUpdate(win: BrowserWindow, tabId: number, changes: Record<string, unknown>): void {
  if (win.isDestroyed()) return
  win.webContents.send('tab-view-updated', { tabId, changes })
}

function getNavState(view: WebContentsView): { canGoBack: boolean; canGoForward: boolean } {
  try {
    return {
      canGoBack: view.webContents.navigationHistory.canGoBack(),
      canGoForward: view.webContents.navigationHistory.canGoForward()
    }
  } catch {
    return { canGoBack: false, canGoForward: false }
  }
}

function applyBoundsForWindow(win: BrowserWindow): void {
  if (win.isDestroyed()) return
  const state = getWindowState(win)
  const bounds = state.contentBounds

  for (const entry of tabEntries.values()) {
    if (entry.window.id !== win.id) continue
    const show =
      entry.tabId === state.activeTabId &&
      bounds.width > 0 &&
      bounds.height > 0 &&
      !isInternalUrl(entry.lastRequestedUrl) &&
      !state.occluded

    entry.view.setBounds(show ? bounds : HIDDEN_BOUNDS)
  }
}

function wireViewEvents(entry: TabEntry): void {
  const { view, tabId } = entry
  const wc = view.webContents

  wc.on('page-title-updated', (_e, title) => {
    sendTabUpdate(entry.window, tabId, { title })
  })

  wc.on('page-favicon-updated', (_e, favicons) => {
    if (favicons?.[0]) {
      sendTabUpdate(entry.window, tabId, { favicon: favicons[0] })
    }
  })

  wc.on('did-navigate', (_e, url) => {
    entry.lastRequestedUrl = url
    sendTabUpdate(entry.window, tabId, { url, ...getNavState(view) })
  })

  wc.on('did-navigate-in-page', (_e, url, isMainFrame) => {
    if (isMainFrame) {
      entry.lastRequestedUrl = url
      sendTabUpdate(entry.window, tabId, { url, ...getNavState(view) })
    } else {
      sendTabUpdate(entry.window, tabId, getNavState(view))
    }
  })

  wc.on('did-start-loading', () => {
    sendTabUpdate(entry.window, tabId, { isLoading: true })
  })

  wc.on('did-stop-loading', () => {
    let url = ''
    let title = ''
    try {
      url = wc.getURL()
      title = wc.getTitle()
    } catch {
      // ignore
    }
    sendTabUpdate(entry.window, tabId, {
      isLoading: false,
      ...getNavState(view),
      ...(url ? { url } : {}),
      ...(title ? { title } : {})
    })
  })

  wc.setWindowOpenHandler(({ url }) => {
    const settings = dbOperations.getSettings()
    if (settings.blockPopups) {
      return { action: 'deny' }
    }
    if (!entry.window.isDestroyed()) {
      entry.window.webContents.send('open-link-in-new-tab', url)
    }
    return { action: 'deny' }
  })

  wc.on('context-menu', (_event, params) => {
    createContextMenu({ sender: wc }, params)
  })
}

function createView(url: string): WebContentsView {
  const settings = dbOperations.getSettings()
  const view = new WebContentsView({
    webPreferences: {
      sandbox: false,
      webSecurity: false,
      // Match prior <webview webpreferences> knobs when Chromium honors them
      ...(settings.enableJavaScript === false ? { javascript: false } : {}),
      ...(settings.enableImages === false ? { images: false } : {})
    } as Electron.WebPreferences
  })
  view.webContents.loadURL(url)
  return view
}

export function registerWindowForTabs(win: BrowserWindow): void {
  getWindowState(win)

  win.on('closed', () => {
    const toDestroy: number[] = []
    for (const [tabId, entry] of tabEntries) {
      if (entry.window.id === win.id) {
        toDestroy.push(tabId)
      }
    }
    for (const tabId of toDestroy) {
      destroyTabView(tabId)
    }
    windowStates.delete(win.id)
    pendingWindowInit.delete(win.id)
    pendingWindowInitDeleteScheduled.delete(win.id)
  })

  win.on('resize', () => applyBoundsForWindow(win))
}

export function setPendingWindowInit(
  win: BrowserWindow,
  tabs: TabViewSnapshot[],
  activeTabId: number
): void {
  pendingWindowInit.set(win.id, { tabs, activeTabId })
}

export function consumePendingWindowInit(
  win: BrowserWindow
): { tabs: TabViewSnapshot[]; activeTabId: number } | null {
  const pending = pendingWindowInit.get(win.id) ?? null
  if (pending && !pendingWindowInitDeleteScheduled.has(win.id)) {
    pendingWindowInitDeleteScheduled.add(win.id)
    // ponytail: allow React StrictMode double-mount to read init twice safely.
    // Ceiling: if the window reloads later within this window, it will still use the seed.
    setTimeout(() => {
      pendingWindowInit.delete(win.id)
      pendingWindowInitDeleteScheduled.delete(win.id)
    }, 10000)
  }
  return pending
}

export function setWindowOccluded(win: BrowserWindow, occluded: boolean): void {
  const state = getWindowState(win)
  state.occluded = occluded
  applyBoundsForWindow(win)
}

export function setContentBounds(win: BrowserWindow, bounds: Rectangle): void {
  const state = getWindowState(win)
  state.contentBounds = {
    x: Math.round(bounds.x),
    y: Math.round(bounds.y),
    width: Math.max(0, Math.round(bounds.width)),
    height: Math.max(0, Math.round(bounds.height))
  }
  applyBoundsForWindow(win)
}

export function ensureTabView(win: BrowserWindow, tabId: number, url: string): void {
  if (isInternalUrl(url)) {
    destroyTabView(tabId)
    return
  }

  const existing = tabEntries.get(tabId)
  if (existing) {
    if (existing.window.id !== win.id) {
      // View belongs to another window — leave it alone
      return
    }
    if (existing.lastRequestedUrl !== url) {
      existing.lastRequestedUrl = url
      existing.view.webContents.loadURL(url)
    }
    applyBoundsForWindow(win)
    return
  }

  const view = createView(url)
  const entry: TabEntry = { tabId, view, window: win, lastRequestedUrl: url }
  tabEntries.set(tabId, entry)
  win.contentView.addChildView(view)
  wireViewEvents(entry)
  applyBoundsForWindow(win)
}

export function destroyTabView(tabId: number): void {
  const entry = tabEntries.get(tabId)
  if (!entry) return

  const { view, window: win } = entry
  tabEntries.delete(tabId)

  try {
    if (!win.isDestroyed()) {
      win.contentView.removeChildView(view)
    }
  } catch {
    // already detached
  }

  try {
    if (!view.webContents.isDestroyed()) {
      view.webContents.close()
    }
  } catch {
    // ignore
  }
}

export function setActiveTabView(win: BrowserWindow, tabId: number | null): void {
  const state = getWindowState(win)
  state.activeTabId = tabId
  applyBoundsForWindow(win)
}

export function navigateTabView(win: BrowserWindow, tabId: number, url: string): void {
  if (isInternalUrl(url)) {
    destroyTabView(tabId)
    applyBoundsForWindow(win)
    return
  }
  ensureTabView(win, tabId, url)
}

export function goBack(tabId: number): void {
  const entry = tabEntries.get(tabId)
  if (entry && entry.view.webContents.navigationHistory.canGoBack()) {
    entry.view.webContents.navigationHistory.goBack()
  }
}

export function goForward(tabId: number): void {
  const entry = tabEntries.get(tabId)
  if (entry && entry.view.webContents.navigationHistory.canGoForward()) {
    entry.view.webContents.navigationHistory.goForward()
  }
}

export function reload(tabId: number): void {
  const entry = tabEntries.get(tabId)
  if (!entry) return
  if (entry.view.webContents.isLoading()) {
    entry.view.webContents.stop()
  } else {
    entry.view.webContents.reload()
  }
}

export function reloadIgnoringCache(tabId: number): void {
  tabEntries.get(tabId)?.view.webContents.reloadIgnoringCache()
}

export function stop(tabId: number): void {
  tabEntries.get(tabId)?.view.webContents.stop()
}

export function snapshotTab(tabId: number): TabViewSnapshot | null {
  const entry = tabEntries.get(tabId)
  if (!entry) return null
  const wc = entry.view.webContents
  let url = entry.lastRequestedUrl
  let title = 'New Tab'
  try {
    url = wc.getURL() || url
    title = wc.getTitle() || title
  } catch {
    // ignore
  }
  return {
    id: tabId,
    title,
    url,
    isLoading: wc.isLoading(),
    ...getNavState(entry.view)
  }
}

/**
 * Move an existing WebContentsView to another window without recreating it.
 */
export function attachTabToWindow(tabId: number, targetWin: BrowserWindow): boolean {
  const entry = tabEntries.get(tabId)
  if (!entry) return false

  const oldWin = entry.window
  if (oldWin.id === targetWin.id) return true

  try {
    if (!oldWin.isDestroyed()) {
      oldWin.contentView.removeChildView(entry.view)
    }
  } catch {
    // already detached
  }

  entry.window = targetWin
  targetWin.contentView.addChildView(entry.view)
  applyBoundsForWindow(oldWin)
  applyBoundsForWindow(targetWin)
  return true
}

export function getTabWindow(tabId: number): BrowserWindow | null {
  return tabEntries.get(tabId)?.window ?? null
}

export function listTabIdsForWindow(win: BrowserWindow): number[] {
  const ids: number[] = []
  for (const entry of tabEntries.values()) {
    if (entry.window.id === win.id) ids.push(entry.tabId)
  }
  return ids
}
