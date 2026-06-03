import Database from 'better-sqlite3';
import {app} from 'electron';
import { join } from 'path'

const dbPath = join(app.getPath('userData'), 'gaspra.db')
const db = new Database(dbPath ,{ verbose: console.log }) as Database.Database;

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

console.log("Database initialized successfully!");
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

export const dbOperations = {
    addBookmark,
    getBookmarks,
    deleteBookmark,
    addHistory,
    getHistory,
    clearHistory,
};




initializeDB();
export default db;