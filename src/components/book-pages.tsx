import { Copy, Ellipsis, Pencil, Plus, Trash2 } from 'lucide-react'
import { BookCover } from '@/components/book-cover'
import type { Side } from '@/components/book'
import { LogoMark } from '@/components/logo-mark'
import { QuoteFlow } from '@/components/quote-flow'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Face, PageMetrics } from '@/lib/book'
import type { Playlist, Quote } from '@/lib/types'

export interface PageActions {
  canEdit: (quote: Quote) => boolean
  onCopy: (quote: Quote) => void
  onEdit: (quote: Quote) => void
  onDelete: (quote: Quote) => void
  // Whether quotes may be added to this book (only to one's own).
  canAdd: boolean
  onAdd: () => void
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

interface BookPageProps {
  face: Face
  side: Side
  playlist: Playlist
  metrics: PageMetrics
  actions: PageActions
}

export function BookPage({
  face,
  side,
  playlist,
  metrics,
  actions,
}: BookPageProps) {
  switch (face.kind) {
    case 'cover':
      return (
        <BookCover
          playlist={playlist}
          className="absolute inset-0"
          style={{ fontSize: metrics.pageW / 15 }}
        />
      )
    case 'back':
      return (
        <div
          className="cover absolute inset-0 flex items-center justify-center"
          style={{ transform: 'scaleX(-1)' }}
        >
          <LogoMark className="size-[3em] -scale-x-100 opacity-60" />
        </div>
      )
    case 'endpaper':
      return <div className="endpaper absolute inset-0" />
    case 'blank':
      return null
    case 'title':
      return (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ paddingInline: metrics.padX }}
        >
          <LogoMark className="size-[2.6em] text-brand" />
          <h2 className="mt-[1.1em] font-serif text-[2em] leading-tight font-medium text-balance">
            {playlist.title}
          </h2>
          {playlist.author && (
            <p className="mt-[0.7em] font-serif text-[1.1em] text-(--page-muted)">
              {playlist.author}
            </p>
          )}
          {playlist.description && (
            <p className="mt-[1.6em] font-serif leading-relaxed whitespace-pre-wrap text-(--page-muted) italic">
              {playlist.description}
            </p>
          )}
          {/* Colophon: who compiled the book and when, tiny at the foot. */}
          <p
            className="absolute inset-x-0 font-serif text-[0.6em] tracking-wide text-(--page-muted) italic"
            style={{ bottom: metrics.footH * 0.55, paddingInline: metrics.padX }}
          >
            {playlist.ownerName} tổng hợp · {formatDate(playlist.createdAt)}
          </p>
        </div>
      )
    case 'empty':
      return (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ paddingInline: metrics.padX }}
        >
          <p className="font-serif text-[1.15em] text-(--page-muted) italic">
            Cuốn sách này chưa có trang nào.
          </p>
          {actions.canAdd && (
            <Button
              className="mt-[1.4em] rounded-full px-4"
              onClick={(event) => {
                event.stopPropagation()
                actions.onAdd()
              }}
            >
              <Plus /> Thêm trích dẫn đầu tiên
            </Button>
          )}
        </div>
      )
    case 'quote':
      return (
        <>
          <div
            className="page-head"
            style={{ height: metrics.headH, paddingInline: metrics.padX }}
          >
            <span>{playlist.title}</span>
          </div>
          <div
            className="page-body"
            data-single={face.parts === 1 ? '' : undefined}
            style={{
              left: metrics.padX,
              top: metrics.headH,
              width: metrics.contentW,
              height: metrics.contentH,
            }}
          >
            <QuoteFlow
              quote={face.quote}
              metrics={metrics}
              part={face.part}
              parts={face.parts}
            />
          </div>
          <div
            className="page-foot"
            style={{ height: metrics.footH, paddingInline: metrics.padX }}
          >
            <span className="page-number">{face.pageNo}</span>
          </div>
          {face.part === 0 && (
            <QuoteMenu quote={face.quote} side={side} actions={actions} />
          )}
        </>
      )
  }
}

interface QuoteMenuProps {
  quote: Quote
  side: Side
  actions: PageActions
}

function QuoteMenu({ quote, side, actions }: QuoteMenuProps) {
  return (
    <div
      className={`absolute top-[0.5em] ${side === 'right' ? 'right-[0.6em]' : 'left-[0.6em]'}`}
      // Using the menu must not turn the page.
      onClick={(event) => event.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Tuỳ chọn trích dẫn"
            className="text-(--page-muted) opacity-50 hover:opacity-100 aria-expanded:opacity-100"
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={side === 'right' ? 'end' : 'start'}
          className="min-w-40"
        >
          <DropdownMenuItem onSelect={() => actions.onCopy(quote)}>
            <Copy /> Sao chép
          </DropdownMenuItem>
          {actions.canEdit(quote) && (
            <>
              <DropdownMenuItem onSelect={() => actions.onEdit(quote)}>
                <Pencil /> Sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => actions.onDelete(quote)}
              >
                <Trash2 /> Xoá
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
