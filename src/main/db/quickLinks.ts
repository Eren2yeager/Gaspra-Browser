import type Database from 'better-sqlite3'

export interface QuickLinkRow {
  id: number
  title: string
  url: string
  position: number
  created_at: string
}

const DEFAULT_QUICK_LINKS = [
  { title: 'Google', url: 'https://www.google.com' },
  { title: 'YouTube', url: 'https://www.youtube.com' },
  { title: 'GitHub', url: 'https://github.com' },
  { title: 'Twitter', url: 'https://twitter.com' }
]

export default function createQuickLinks(db: Database.Database) {
  function seedDefaultQuickLinks() {
    const count = db.prepare('SELECT COUNT(*) as count FROM quick_links').get() as { count: number }
    if (count.count > 0) return

    const stmt = db.prepare('INSERT INTO quick_links (title, url, position) VALUES (?, ?, ?)')
    DEFAULT_QUICK_LINKS.forEach((link, index) => {
      stmt.run(link.title, link.url, index)
    })
  }

  function getQuickLinks(): QuickLinkRow[] {
    const stmt = db.prepare('SELECT * FROM quick_links ORDER BY position ASC, created_at ASC')
    return stmt.all() as QuickLinkRow[]
  }

  function addQuickLink(title: string, url: string) {
    const maxPosition = db.prepare('SELECT COALESCE(MAX(position), -1) as maxPos FROM quick_links').get() as {
      maxPos: number
    }
    const stmt = db.prepare('INSERT INTO quick_links (title, url, position) VALUES (?, ?, ?)')
    const result = stmt.run(title, url, maxPosition.maxPos + 1)
    return result.lastInsertRowid as number
  }

  function updateQuickLink(id: number, title: string, url: string) {
    const stmt = db.prepare('UPDATE quick_links SET title = ?, url = ? WHERE id = ?')
    stmt.run(title, url, id)
  }

  function deleteQuickLink(id: number) {
    const stmt = db.prepare('DELETE FROM quick_links WHERE id = ?')
    stmt.run(id)
  }

  return {
    seedDefaultQuickLinks,
    getQuickLinks,
    addQuickLink,
    updateQuickLink,
    deleteQuickLink
  }
}
