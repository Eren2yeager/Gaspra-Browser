import type Database from 'better-sqlite3'
import { app } from 'electron'

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  defaultSearchEngine: 'google',
  saveHistory: true,
  saveDownloadHistory: true,
  saveSearchHistory: true,
  downloadPath: app.getPath('downloads'),
  askWhereToSave: true,
  startupPage: 'newtab',
  homepage: 'https://google.com',
  blockPopups: true,
  enableJavaScript: true,
  enableImages: true,
  saveTabsOnClose: true,
  openNewTabPosition: 'end',
  warnOnCloseMultipleTabs: true,
  hardwareAcceleration: true,
  language: 'en-US'
} as const

export default function createSettings(
  db: Database.Database,
  DEFAULT_SETTINGS: Record<string, any>
) {
  function getSettings(): Record<string, any> {
    const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{
      key: string
      value: string
    }>
    const settings: Record<string, any> = {}
    rows.forEach((row) => {
      try {
        settings[row.key] = JSON.parse(row.value)
      } catch (e) {
        console.error(`Failed to parse setting ${row.key}:`, e)
        settings[row.key] = DEFAULT_SETTINGS[row.key]
      }
    })
    return { ...DEFAULT_SETTINGS, ...settings }
  }

  function updateSetting(key: string, value: any) {
    const stmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `)
    stmt.run(key, JSON.stringify(value))
  }

  function updateSettings(partialSettings: Record<string, any>) {
    Object.entries(partialSettings).forEach(([key, value]) => {
      updateSetting(key, value)
    })
  }

  function resetSettings() {
    const stmt = db.prepare('DELETE FROM settings')
    stmt.run()
    // re-insert defaults
    const insertStmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
    Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) =>
      insertStmt.run(key, JSON.stringify(value))
    )
  }

  return { getSettings, updateSetting, updateSettings, resetSettings }
}
