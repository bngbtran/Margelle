import { BookOpen, Copy, Ellipsis, Heart, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Quote } from '@/lib/types'
import { cn } from '@/lib/utils'

// Rough cut-off for when the clamped card is hiding part of the quote.
const LONG_TEXT = 520

interface QuoteCardProps {
  quote: Quote
  onRead: () => void
  onEdit: () => void
  onDelete: () => void
  onCopy: () => void
  onToggleFavorite: () => void
  onPickTag: (tag: string) => void
}

export function QuoteCard({
  quote,
  onRead,
  onEdit,
  onDelete,
  onCopy,
  onToggleFavorite,
  onPickTag,
}: QuoteCardProps) {
  const isLong =
    quote.text.length > LONG_TEXT || quote.text.split('\n').length > 10

  return (
    <article className="group relative mb-5 break-inside-avoid animate-in rounded-2xl border bg-card p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-shadow duration-300 fade-in slide-in-from-bottom-2 hover:shadow-[0_8px_30px_rgb(0_0_0/0.07)]">
      <div className="flex items-start justify-between">
        <span
          aria-hidden
          className="font-serif text-6xl leading-[0.7] text-brand/50 select-none"
        >
          “
        </span>
        <div className="-mt-2 -mr-2 flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleFavorite}
            aria-pressed={quote.favorite}
            aria-label={quote.favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
            className={cn(
              'transition-opacity',
              !quote.favorite &&
                'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100',
            )}
          >
            <Heart
              className={cn(quote.favorite && 'fill-brand stroke-brand')}
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Tuỳ chọn"
                className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 aria-expanded:opacity-100 max-md:opacity-100"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuItem onSelect={onRead}>
                <BookOpen /> Đọc toàn bộ
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onCopy}>
                <Copy /> Sao chép
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil /> Sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Trash2 /> Xoá
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p
        onClick={onRead}
        className="mt-1 line-clamp-[12] cursor-pointer font-serif text-[1.0625rem] leading-[1.75] whitespace-pre-wrap"
      >
        {quote.text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={onRead}
          className="mt-2 text-sm font-medium text-brand underline-offset-4 hover:underline"
        >
          Đọc tiếp
        </button>
      )}

      {(quote.book || quote.author || quote.page) && (
        <footer className="mt-5 border-t pt-4 text-sm">
          {quote.book && (
            <p className="font-serif font-medium italic">{quote.book}</p>
          )}
          <p className="text-muted-foreground">
            {[quote.author, quote.page && `tr. ${quote.page}`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </footer>
      )}

      {quote.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {quote.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onPickTag(tag)}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </article>
  )
}
