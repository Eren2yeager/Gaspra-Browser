export interface QuickLink {
  id: number
  title: string
  url: string
  position: number
  created_at: string
}

export function normalizeQuickLinkUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

export function getQuickLinkFavicon(url: string): string {
  try {
    const hostname = new URL(normalizeQuickLinkUrl(url)).hostname
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return ''
  }
}

export function isValidQuickLinkUrl(url: string): boolean {
  try {
    const normalized = normalizeQuickLinkUrl(url)
    if (!normalized) return false
    new URL(normalized)
    return true
  } catch {
    return false
  }
}
