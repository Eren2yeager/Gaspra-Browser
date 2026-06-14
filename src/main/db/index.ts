import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

import createBookmarks from './bookmarks'
import createHistory from './history'
import createDownloads from './downloads'
import createSearchHistory from './searchHistory'
import createSettings from './settings'
import createTabs from './tabs'

import {DEFAULT_SETTINGS} from './settings'
const dbPath = join(app.getPath('userData'), 'gaspra.db')
const db = new Database(dbPath, { verbose: console.log }) as Database.Database



function initializeDB() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  db.prepare(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      visited_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  db.prepare(`
    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      url TEXT NOT NULL,
      save_path TEXT NOT NULL,
      total_bytes INTEGER,
      received_bytes INTEGER DEFAULT 0,
      state TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  db.prepare(`
    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL UNIQUE,
      last_searched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      search_count INTEGER DEFAULT 1
    )
  `).run()

  db.prepare(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  db.prepare(`
    CREATE TABLE IF NOT EXISTS tabs (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      position INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  initializeSettings()
  console.log('Database initialized successfully!')
}

function initializeSettings() {
  const insertStmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
    insertStmt.run(key, JSON.stringify(value))
  })
}

// create module instances
const bookmarks = createBookmarks(db)
const history = createHistory(db)
const downloads = createDownloads(db)
const searchHistory = createSearchHistory(db)
const settings = createSettings(db, DEFAULT_SETTINGS)
const tabs = createTabs(db)

export const dbOperations = {
  ...bookmarks,
  ...history,
  ...downloads,
  ...searchHistory,
  ...settings,
  ...tabs
}

export { db }

initializeDB()
