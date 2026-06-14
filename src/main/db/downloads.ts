import type Database from 'better-sqlite3'





export default function createDownloads(db: Database.Database) {
  function addDownload(id: string, filename: string, url: string, savePath: string, totalBytes: number | null, state: string) {
    const stmt = db.prepare('INSERT INTO downloads (id, filename, url, save_path, total_bytes, state, started_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    stmt.run(id, filename, url, savePath, totalBytes, state, new Date().toISOString())
  }

  function updateDownload(id: string, receivedBytes: number, state: string, totalBytes?: number | null) {
    if (totalBytes !== undefined) {
      const stmt = db.prepare('UPDATE downloads SET received_bytes = ?, state = ?, total_bytes = ? WHERE id = ?')
      stmt.run(receivedBytes, state, totalBytes, id)
    } else {
      const stmt = db.prepare('UPDATE downloads SET received_bytes = ?, state = ? WHERE id = ?')
      stmt.run(receivedBytes, state, id)
    }
  }

  function getDownloads() {
    const stmt = db.prepare('SELECT * FROM downloads ORDER BY started_at DESC')
    return stmt.all()
  }

  function getDownloadsGroupedByDate() {
    const stmt = db.prepare('SELECT * FROM downloads ORDER BY started_at DESC')
    const downloads = stmt.all() as any[]
    const grouped: Record<string, any[]> = {}
    downloads.forEach(item => {
      const date = new Date(item.started_at).toDateString()
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(item)
    })
    return grouped
  }

  function searchDownloads(query: string) {
    const stmt = db.prepare(`
      SELECT * FROM downloads
      WHERE filename LIKE ? OR url LIKE ?
      ORDER BY started_at DESC
    `)
    const searchTerm = `%${query}%`
    return stmt.all(searchTerm, searchTerm)
  }

  function clearDownloads() {
    const stmt = db.prepare('DELETE FROM downloads')
    stmt.run()
  }

  function deleteDownload(id: string) {
    const stmt = db.prepare('DELETE FROM downloads WHERE id = ?')
    stmt.run(id)
  }

  return {
    addDownload,
    updateDownload,
    getDownloads,
    getDownloadsGroupedByDate,
    searchDownloads,
    clearDownloads,
    deleteDownload
  }
}
