import type Database from 'better-sqlite3'

export default function createHistory(db: Database.Database) {
  function addHistory(title: string, url: string) {
    const stmt = db.prepare('INSERT INTO history (title, url, visited_at) VALUES (?, ?, ?)')
    stmt.run(title, url, new Date().toISOString())
  }

  function getHistory() {
    const stmt = db.prepare('SELECT * FROM history ORDER BY visited_at DESC')
    return stmt.all()
  }

  function getHistoryGroupedByDate() {
    const stmt = db.prepare('SELECT * FROM history ORDER BY visited_at DESC')
    const history = stmt.all() as any[]
    const grouped: Record<string, any[]> = {}
    history.forEach(item => {
      const date = new Date(item.visited_at).toDateString()
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(item)
    })
    return grouped
  }

  function searchHistory(query: string) {
    const stmt = db.prepare(`
      SELECT * FROM history
      WHERE title LIKE ? OR url LIKE ?
      ORDER BY visited_at DESC
    `)
    const searchTerm = `%${query}%`
    return stmt.all(searchTerm, searchTerm)
  }

  function deleteHistoryItem(id: number) {
    const stmt = db.prepare('DELETE FROM history WHERE id = ?')
    stmt.run(id)
  }

  function clearHistory() {
    const stmt = db.prepare('DELETE FROM history')
    stmt.run()
  }

  return {
    addHistory,
    getHistory,
    getHistoryGroupedByDate,
    searchHistory,
    deleteHistoryItem,
    clearHistory
  }
}
