import type Database from 'better-sqlite3'

export default function createBookmarks(db: Database.Database) {
  function addBookmark(title: string, url: string) {
    const stmt = db.prepare('INSERT INTO bookmarks (title, url) VALUES (?, ?)')
    stmt.run(title, url)
  }

  function getBookmarks() {
    const stmt = db.prepare('SELECT * FROM bookmarks ORDER BY created_at DESC')
    return stmt.all()
  }

  function deleteBookmark(id: number) {
    const stmt = db.prepare('DELETE FROM bookmarks WHERE id = ?')
    stmt.run(id)
  }

  return { addBookmark, getBookmarks, deleteBookmark }
}
