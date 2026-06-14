import type Database from 'better-sqlite3'

export default function createSearchHistory(db: Database.Database) {
  function addSearch(query: string) {
    const existing = db.prepare('SELECT * FROM search_history WHERE query = ?').get(query)
    if (existing) {
      const stmt = db.prepare('UPDATE search_history SET search_count = search_count + 1, last_searched_at = CURRENT_TIMESTAMP WHERE query = ?')
      stmt.run(query)
    } else {
      const stmt = db.prepare('INSERT INTO search_history (query) VALUES (?)')
      stmt.run(query)
    }
  }

  function getSearchHistory(limit: number = 10) {
    const stmt = db.prepare('SELECT * FROM search_history ORDER BY last_searched_at DESC LIMIT ?')
    return stmt.all(limit)
  }

  function clearSearchHistory() {
    const stmt = db.prepare('DELETE FROM search_history')
    stmt.run()
  }

  function deleteSearch(id: number) {
    const stmt = db.prepare('DELETE FROM search_history WHERE id = ?')
    stmt.run(id)
  }

  return { addSearch, getSearchHistory, clearSearchHistory, deleteSearch }
}
