/** MIME types commonly used when dragging links (in-browser and from other apps). */
const LINK_DRAG_TYPES = ['text/uri-list', 'text/x-moz-url', 'URL', 'text/plain'] as const

export function isLinkDrag(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false
  const types = Array.from(dataTransfer.types)
  // File-only drops are not links.
  if (types.includes('Files') && !types.some((t) => LINK_DRAG_TYPES.includes(t as (typeof LINK_DRAG_TYPES)[number]))) {
    return false
  }
  return types.some((t) => LINK_DRAG_TYPES.includes(t as (typeof LINK_DRAG_TYPES)[number]))
}

function normalizeHttpUrl(raw: string): string | null {
  let s = raw.trim().replace(/^<|>$/g, '')
  if (!s) return null

  // Strip surrounding quotes from some apps.
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim()
  }

  if (!/^https?:\/\//i.test(s)) {
    // Accept bare domains dragged as plain text.
    if (/^(www\.)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(s)) {
      s = `https://${s}`
    } else {
      return null
    }
  }

  try {
    const url = new URL(s)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.href
  } catch {
    return null
  }
}

function firstHttpFromUriList(uriList: string): string | null {
  for (const line of uriList.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const url = normalizeHttpUrl(trimmed)
    if (url) return url
  }
  return null
}

/**
 * Read an http(s) URL from a drop/paste DataTransfer.
 * Supports Chromium `text/uri-list`, Firefox `text/x-moz-url`,
 * Windows `URL`, and plain text from other apps.
 */
export function extractDroppedUrl(dataTransfer: DataTransfer | null): string | null {
  if (!dataTransfer) return null

  const uriList = dataTransfer.getData('text/uri-list')
  if (uriList) {
    const fromList = firstHttpFromUriList(uriList)
    if (fromList) return fromList
  }

  // Firefox: "https://example.com\nPage Title"
  const mozUrl = dataTransfer.getData('text/x-moz-url')
  if (mozUrl) {
    const firstLine = mozUrl.split(/\r?\n/)[0]?.trim()
    if (firstLine) {
      const url = normalizeHttpUrl(firstLine)
      if (url) return url
    }
  }

  const winUrl = dataTransfer.getData('URL')
  if (winUrl) {
    const url = normalizeHttpUrl(winUrl)
    if (url) return url
  }

  const plain = dataTransfer.getData('text/plain')?.trim()
  if (plain) {
    for (const line of plain.split(/\r?\n/)) {
      const url = normalizeHttpUrl(line.trim())
      if (url) return url
    }
    const match = plain.match(/https?:\/\/[^\s<>"')\]]+/i)
    if (match) {
      return normalizeHttpUrl(match[0].replace(/[.,;:!?)]+$/, ''))
    }
  }

  return null
}
