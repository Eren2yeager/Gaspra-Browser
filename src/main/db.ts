import Database from 'better-sqlite3';
import {app} from 'electron';
import { join } from 'path'

const dbPath = join(app.getPath('userData'), 'gaspra.db')
const db = new Database(dbPath ,{ verbose: console.log }) as Database.Database;

// Define types
export interface Tab {
  id: string;
  url: string;
  title: string;
  isActive: boolean;
  position: number;
  createdAt: string;
}

// Define default settings
const DEFAULT_SETTINGS = {
  // Appearance settings
  theme: 'dark', // 'light', 'dark', 'system'
  // Search settings
  defaultSearchEngine: 'google', // 'google', 'bing', 'duckduckgo', 'yahoo'
  // Privacy settings
  saveHistory: true,
  saveDownloadHistory: true,
  saveSearchHistory: true,
  // Download settings
  downloadPath: app.getPath('downloads'),
  askWhereToSave: true,
  // Startup settings
  startupPage: 'newtab', // 'newtab', 'homepage', 'continue'
  homepage: 'https://google.com',
  // Browsing settings
  blockPopups: true,
  enableJavaScript: true,
  enableImages: true,
  // Tab settings
  saveTabsOnClose: true, // Save tabs when app closes
  openNewTabPosition: 'end', // 'end', 'after current'
  warnOnCloseMultipleTabs: true, // Warn when closing window with multiple tabs
  // Performance settings
  hardwareAcceleration: true,
  // Language settings
  language: 'en-US'
};

// Type for settings
export type BrowserSettings = typeof DEFAULT_SETTINGS;

// Initialize the database and create tables if they don't exist
function initializeDB() {
db.prepare(
    `
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `
).run();

db.prepare(
    `
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      visited_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `
).run();

db.prepare(
    `
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
    `
).run();

db.prepare(
    `
    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL UNIQUE,
      last_searched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      search_count INTEGER DEFAULT 1
    )
    `
).run();

db.prepare(
    `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `
).run();

db.prepare(
    `
    CREATE TABLE IF NOT EXISTS tabs (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      position INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `
).run();

// Initialize settings with defaults if not exists
initializeSettings();

console.log("Database initialized successfully!");
}

// Initialize settings with default values
function initializeSettings() {
  const insertStmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
    insertStmt.run(key, JSON.stringify(value));
  });
}

//bookmark operations
function addBookmark(title: string, url: string) {
    const stmt = db.prepare('INSERT INTO bookmarks (title, url) VALUES (?, ?)');
    stmt.run(title, url);
}

function getBookmarks(){
    const stmt =  db.prepare('SELECT * FROM bookmarks ORDER BY created_at DESC')
    return stmt.all();
}

function deleteBookmark(id: number) {
    const stmt = db.prepare('DELETE FROM bookmarks WHERE id = ?');
    stmt.run(id);
}

//history operations
function addHistory(title: string, url: string) {
    const stmt = db.prepare('INSERT INTO history (title, url) VALUES (?, ?)');
    stmt.run(title, url);
}

function getHistory(){
    const stmt =  db.prepare('SELECT * FROM history ORDER BY visited_at DESC')
    return stmt.all();
}

function clearHistory() {
    const stmt = db.prepare('DELETE FROM history');
    stmt.run();
}

//download operations
function addDownload(id: string, filename: string, url: string, savePath: string, totalBytes: number | null, state: string) {
    const stmt = db.prepare('INSERT INTO downloads (id, filename, url, save_path, total_bytes, state) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, filename, url, savePath, totalBytes, state);
}

function updateDownload(id: string, receivedBytes: number, state: string, totalBytes?: number | null) {
    if (totalBytes !== undefined) {
        const stmt = db.prepare('UPDATE downloads SET received_bytes = ?, state = ?, total_bytes = ? WHERE id = ?');
        stmt.run(receivedBytes, state, totalBytes, id);
    } else {
        const stmt = db.prepare('UPDATE downloads SET received_bytes = ?, state = ? WHERE id = ?');
        stmt.run(receivedBytes, state, id);
    }
}

function getDownloads() {
    const stmt = db.prepare('SELECT * FROM downloads ORDER BY started_at DESC');
    return stmt.all();
}

function clearDownloads() {
    const stmt = db.prepare('DELETE FROM downloads');
    stmt.run();
}

function deleteDownload(id: string) {
    const stmt = db.prepare('DELETE FROM downloads WHERE id = ?');
    stmt.run(id);
}

// search history operations
function addSearch(query: string) {
    // If query exists, increment count and update last_searched_at
    const existing = db.prepare('SELECT * FROM search_history WHERE query = ?').get(query);
    if (existing) {
        const stmt = db.prepare('UPDATE search_history SET search_count = search_count + 1, last_searched_at = CURRENT_TIMESTAMP WHERE query = ?');
        stmt.run(query);
    } else {
        const stmt = db.prepare('INSERT INTO search_history (query) VALUES (?)');
        stmt.run(query);
    }
}

function getSearchHistory(limit: number = 10) {
    const stmt = db.prepare('SELECT * FROM search_history ORDER BY last_searched_at DESC LIMIT ?');
    return stmt.all(limit);
}

function clearSearchHistory() {
    const stmt = db.prepare('DELETE FROM search_history');
    stmt.run();
}

function deleteSearch(id: number) {
    const stmt = db.prepare('DELETE FROM search_history WHERE id = ?');
    stmt.run(id);
}

// settings operations
function getSettings(): BrowserSettings {
    const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
    const settings: Record<string, any> = {};
    
    rows.forEach(row => {
        try {
            settings[row.key] = JSON.parse(row.value);
        } catch (e) {
            console.error(`Failed to parse setting ${row.key}:`, e);
            settings[row.key] = DEFAULT_SETTINGS[row.key as keyof BrowserSettings];
        }
    });

    // Merge with defaults to ensure all settings exist
    return { ...DEFAULT_SETTINGS, ...settings };
}

function updateSetting<K extends keyof BrowserSettings>(key: K, value: BrowserSettings[K]) {
    const stmt = db.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(key, JSON.stringify(value));
}

function updateSettings(partialSettings: Partial<BrowserSettings>) {
    Object.entries(partialSettings).forEach(([key, value]) => {
        updateSetting(key as keyof BrowserSettings, value as BrowserSettings[keyof BrowserSettings]);
    });
}

function resetSettings() {
    const stmt = db.prepare('DELETE FROM settings');
    stmt.run();
    initializeSettings();
}

// tab operations
function getTabs(): Tab[] {
    const rows = db.prepare('SELECT * FROM tabs ORDER BY position ASC').all() as any[];
    return rows.map(row => ({
        id: row.id,
        url: row.url,
        title: row.title,
        isActive: row.is_active === 1,
        position: row.position,
        createdAt: row.created_at
    }));
}

function saveTabs(tabs: Tab[]) {
    // Clear existing tabs
    db.prepare('DELETE FROM tabs').run();
    
    // Insert new tabs
    const insertStmt = db.prepare(
        'INSERT INTO tabs (id, url, title, is_active, position, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    
    tabs.forEach(tab => {
        insertStmt.run(
            tab.id,
            tab.url,
            tab.title,
            tab.isActive ? 1 : 0,
            tab.position,
            tab.createdAt
        );
    });
}

function clearTabs() {
    db.prepare('DELETE FROM tabs').run();
}

export const dbOperations = {
    addBookmark,
    getBookmarks,
    deleteBookmark,
    addHistory,
    getHistory,
    clearHistory,
    addDownload,
    updateDownload,
    getDownloads,
    clearDownloads,
    deleteDownload,
    addSearch,
    getSearchHistory,
    clearSearchHistory,
    deleteSearch,
    getSettings,
    updateSetting,
    updateSettings,
    resetSettings,
    getTabs,
    saveTabs,
    clearTabs
};




initializeDB();
export default db;