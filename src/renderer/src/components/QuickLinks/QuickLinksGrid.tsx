import { useCallback, useEffect, useState } from 'react'
import { Globe, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  getQuickLinkFavicon,
  isValidQuickLinkUrl,
  normalizeQuickLinkUrl,
  type QuickLink
} from './quickLinksUtils'

interface QuickLinksGridProps {
  onNavigate: (url: string) => void
}

type DialogMode = 'add' | 'edit' | null

const MAX_QUICK_LINKS = 10

export default function QuickLinksGrid({ onNavigate }: QuickLinksGridProps) {
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const refreshQuickLinks = useCallback(async () => {
    try {
      const response = await window.browserAPI.getQuickLinks()
      if (response.success) {
        setQuickLinks(response.quickLinks ?? [])
      }
    } catch (err) {
      console.error('Error fetching quick links:', err)
    }
  }, [])

  useEffect(() => {
    let isActive = true

    void (async () => {
      try {
        const response = await window.browserAPI.getQuickLinks()
        if (isActive && response.success) {
          setQuickLinks(response.quickLinks ?? [])
        }
      } catch (err) {
        console.error('Error fetching quick links:', err)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      isActive = false
    }
  }, [])

  const openAddDialog = () => {
    setDialogMode('add')
    setEditingLink(null)
    setTitle('')
    setUrl('')
    setError('')
  }

  const openEditDialog = (link: QuickLink) => {
    setDialogMode('edit')
    setEditingLink(link)
    setTitle(link.title)
    setUrl(link.url)
    setError('')
  }

  const closeDialog = () => {
    setDialogMode(null)
    setEditingLink(null)
    setTitle('')
    setUrl('')
    setError('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedTitle = title.trim()
    const normalizedUrl = normalizeQuickLinkUrl(url)

    if (!trimmedTitle) {
      setError('Name is required.')
      return
    }

    if (!isValidQuickLinkUrl(url)) {
      setError('Enter a valid URL.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      if (dialogMode === 'add') {
        // enforce maximum quick links
        if (quickLinks.length >= MAX_QUICK_LINKS) {
          setError(`You can only have up to ${MAX_QUICK_LINKS} quick links.`)
          return
        }
        const response = await window.browserAPI.addQuickLink(trimmedTitle, normalizedUrl)
        if (!response.success) {
          setError(response.error ?? 'Failed to add shortcut.')
          return
        }
      } else if (dialogMode === 'edit' && editingLink) {
        const response = await window.browserAPI.updateQuickLink(
          editingLink.id,
          trimmedTitle,
          normalizedUrl
        )
        if (!response.success) {
          setError(response.error ?? 'Failed to update shortcut.')
          return
        }
      }

      await refreshQuickLinks()
      closeDialog()
    } catch (err) {
      console.error('Error saving quick link:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (link: QuickLink) => {
    try {
      const response = await window.browserAPI.deleteQuickLink(link.id)
      if (response.success) {
        await refreshQuickLinks()
      }
    } catch (err) {
      console.error('Error deleting quick link:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-wrap justify-center gap-4">
        {quickLinks.map((link) => (
          <div
            key={link.id}
            className="group relative w-[112px]"
          >
            <button
              type="button"
              onClick={() => onNavigate(link.url)}
              className="flex w-full flex-col items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted shadow-sm">
                <img
                  src={getQuickLinkFavicon(link.url)}
                  alt=""
                  className="h-6 w-6"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                    event.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <Globe size={22} className="hidden text-muted-foreground" />
              </div>
              <span className="line-clamp-2 truncate w-full bg-muted/50 rounded-full px-1.5 py-0.5 font-medium text-center text-xs text-foreground">
                {link.title}
              </span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-0 top-0 h-7 w-7  opacity-0 shadow-sm transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                  onClick={(event) => event.stopPropagation()}
                  aria-label={`Options for ${link.title}`}
                >
                  <MoreVertical size={14} className="text-foreground " />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-popover p-1">
                <DropdownMenuItem onClick={() => openEditDialog(link)}>
                  <Pencil />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="focus:bg-destructive"
                  onClick={() => handleDelete(link)}
                >
                  <Trash2 />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
        {quickLinks.length < MAX_QUICK_LINKS && (
          <button
            type="button"
            onClick={openAddDialog}
            className="flex w-[112px] flex-col items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-muted/50"
            aria-label="Add shortcut"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-foreground/40 bg-muted/30">
              <Plus size={22} className="text-foreground" />
            </div>
            <span className="text-xs text-foreground font-medium bg-muted/50 px-2 py-0.5 rounded-full">Add shortcut</span>
          </button>
        )}
      </div>

      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'edit' ? 'Edit shortcut' : 'Add shortcut'}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'edit'
                ? 'Update the name or URL for this shortcut.'
                : 'Create a shortcut that appears on your new tab page.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quicklink-name">Name</Label>
              <Input
                id="quicklink-name"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Google"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quicklink-url">URL</Label>
              <Input
                id="quicklink-url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://www.google.com"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {dialogMode === 'edit' ? 'Save' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
