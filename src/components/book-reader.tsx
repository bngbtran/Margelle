import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Book, type Side } from '@/components/book'
import { BookPage, type PageActions } from '@/components/book-pages'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePageCounts } from '@/hooks/use-page-counts'
import { usePageMetrics } from '@/hooks/use-page-metrics'
import { layoutBook, type Face, type Leaf } from '@/lib/book'
import type { Playlist, Quote } from '@/lib/types'

interface BookReaderProps {
  playlist: Playlist
  // Oldest first.
  quotes: Quote[]
  // Open the book at this quote instead of at the cover.
  targetQuoteId: string | null
  onTargetReached: () => void
  canEditPlaylist: boolean
  actions: PageActions
  onClose: () => void
  onEditPlaylist: () => void
  onDeletePlaylist: () => void
}

// How long the closed cover is shown before the book opens by itself.
const AUTO_OPEN_DELAY = 650

// Shown until the pages are laid out, so the cover is on screen from the very
// first frame and the shelf-to-reader transition has something to land on.
const CLOSED_BOOK: Leaf[] = [
  { front: { kind: 'cover' }, back: { kind: 'endpaper' } },
]

function pageNumber(face: Face | undefined) {
  return face?.kind === 'quote' ? face.pageNo : null
}

function describePosition(leaves: Leaf[], position: number, total: number) {
  if (position === 0) return 'Bìa trước'
  if (position >= leaves.length) return 'Bìa sau'
  const numbers = [
    pageNumber(leaves[position - 1]?.back),
    pageNumber(leaves[position]?.front),
  ].filter((n): n is number => n !== null)
  if (numbers.length === 0) return total > 0 ? 'Trang mở đầu' : 'Chưa có trang'
  return `Trang ${numbers.join('–')} / ${total}`
}

export function BookReader({
  playlist,
  quotes,
  targetQuoteId,
  onTargetReached,
  canEditPlaylist,
  actions,
  onClose,
  onEditPlaylist,
  onDeletePlaylist,
}: BookReaderProps) {
  const metrics = usePageMetrics()
  const { counts, measurer } = usePageCounts(quotes, metrics)
  const layout = useMemo(
    () => (counts ? layoutBook(quotes, counts, metrics.spread) : null),
    [quotes, counts, metrics.spread],
  )

  const [position, setPosition] = useState(0)
  // True until the book has opened for the first time.
  const [fresh, setFresh] = useState(true)
  // The quote in view, so the reader stays on it when the page size changes.
  const anchor = useRef<string | null>(null)
  const maxPosition = layout ? layout.leaves.length : 0
  const shown = Math.min(position, maxPosition)

  function goTo(next: number) {
    if (!layout) return
    const clamped = Math.max(0, Math.min(layout.leaves.length, next))
    const face = layout.leaves[clamped]?.front
    anchor.current = face?.kind === 'quote' ? face.quote.id : null
    setFresh(false)
    setPosition(clamped)
  }

  // Jump to a requested quote once its pages exist.
  useEffect(() => {
    if (!layout || !targetQuoteId) return
    const target = layout.positionOf.get(targetQuoteId)
    if (target === undefined) return
    anchor.current = targetQuoteId
    setFresh(false)
    setPosition(target)
    onTargetReached()
  }, [layout, targetQuoteId, onTargetReached])

  // Open the cover by itself shortly after the book appears.
  useEffect(() => {
    if (!layout || !fresh || targetQuoteId) return
    const timer = setTimeout(() => {
      setFresh(false)
      setPosition((current) => (current === 0 ? 1 : current))
    }, AUTO_OPEN_DELAY)
    return () => clearTimeout(timer)
  }, [layout, fresh, targetQuoteId])

  // Page numbers shift when the page size changes; stay on the same quote.
  const sizeKey = `${metrics.pageW}x${metrics.pageH}:${metrics.spread}`
  const lastSizeKey = useRef(sizeKey)
  useEffect(() => {
    if (!layout || lastSizeKey.current === sizeKey) return
    lastSizeKey.current = sizeKey
    const target = anchor.current && layout.positionOf.get(anchor.current)
    if (typeof target === 'number') setPosition(target)
  }, [layout, sizeKey])

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      // Leave the keys alone while typing or while a dialog or menu is open.
      if (
        event.target instanceof Element &&
        event.target.closest('input, textarea, select')
      ) {
        return
      }
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        setFresh(false)
        setPosition((current) => Math.min(maxPosition, current + 1))
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        setFresh(false)
        setPosition((current) => Math.max(0, current - 1))
      } else if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [maxPosition, onClose])

  function renderFace(face: Face, side: Side) {
    return (
      <BookPage
        face={face}
        side={side}
        playlist={playlist}
        metrics={metrics}
        actions={actions}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-[radial-gradient(ellipse_at_center,var(--background),var(--wall))]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-3 sm:px-5">
        <Button variant="ghost" onClick={onClose}>
          <ArrowLeft /> Kệ sách
        </Button>
        <h1 className="mx-auto truncate px-2 font-serif text-lg font-medium">
          {playlist.title}
        </h1>
        {actions.canAdd && (
          <Button className="rounded-full px-3.5" onClick={actions.onAdd}>
            <Plus /> <span className="max-sm:hidden">Thêm trích dẫn</span>
          </Button>
        )}
        {canEditPlaylist && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Tuỳ chọn playlist">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onSelect={onEditPlaylist}>
                <Pencil /> Sửa playlist
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={onDeletePlaylist}>
                <Trash2 /> Xoá playlist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <Book
          leaves={layout?.leaves ?? CLOSED_BOOK}
          position={shown}
          metrics={metrics}
          color={playlist.color}
          coverOnly={fresh && shown === 0}
          onNext={() => goTo(shown + 1)}
          onPrev={() => goTo(shown - 1)}
          renderFace={renderFace}
        />
      </div>

      <footer className="flex h-[68px] shrink-0 items-center justify-center gap-3 px-4">
        <Button
          variant="outline"
          size="icon-lg"
          className="rounded-full"
          aria-label="Trang trước"
          disabled={shown === 0}
          onClick={() => goTo(shown - 1)}
        >
          <ChevronLeft />
        </Button>
        <input
          type="range"
          min={0}
          max={maxPosition}
          value={shown}
          onChange={(event) => goTo(Number(event.target.value))}
          aria-label="Vị trí trong sách"
          className="min-w-0 flex-1 accent-(--brand) sm:max-w-72"
        />
        <p
          className="min-w-28 text-center text-sm whitespace-nowrap text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          {layout
            ? describePosition(layout.leaves, shown, layout.totalPages)
            : ''}
        </p>
        <Button
          variant="outline"
          size="icon-lg"
          className="rounded-full"
          aria-label="Trang sau"
          disabled={shown >= maxPosition}
          onClick={() => goTo(shown + 1)}
        >
          <ChevronRight />
        </Button>
      </footer>

      {measurer}
    </div>
  )
}
