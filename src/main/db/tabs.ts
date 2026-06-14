import type Database from 'better-sqlite3'

export type Tab = {
  id: string
  url: string
  title: string
  isActive: boolean
  position: number
  createdAt: string
}

export default function createTabs(db: Database.Database) {
  function getTabs(): Tab[] {
    const rows = db.prepare('SELECT * FROM tabs ORDER BY position ASC').all() as any[]
    return rows.map(row => ({
      id: row.id,
      url: row.url,
      title: row.title,
      isActive: row.is_active === 1,
      position: row.position,
      createdAt: row.created_at
    }))
  }

  function saveTabs(tabs: Tab[]) {
    db.prepare('DELETE FROM tabs').run()
    const insertStmt = db.prepare('INSERT INTO tabs (id, url, title, is_active, position, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    tabs.forEach(tab => {
      insertStmt.run(tab.id, tab.url, tab.title, tab.isActive ? 1 : 0, tab.position, tab.createdAt)
    })
  }

  function clearTabs() {
    db.prepare('DELETE FROM tabs').run()
  }

  return { getTabs, saveTabs, clearTabs }
}
