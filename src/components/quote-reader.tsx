import { Copy, Heart, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Quote } from '@/lib/types'
import { cn } from '@/lib/utils'

interface QuoteReaderProps {
  quote: Quote
  onClose: () => void
  onEdit: () => void
  onCopy: () => void
  onToggleFavorite: () => void
}

export function QuoteReader({
  quote,
  onClose,
  onEdit,
  onCopy,
  onToggleFavorite,
}: QuoteReaderProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4 pr-12 sm:px-10">
          <DialogTitle className="font-serif text-lg leading-snug italic">
            {quote.book || 'Trích dẫn'}
          </DialogTitle>
          <DialogDescription>
            {[quote.author, quote.page && `tr. ${quote.page}`]
              .filter(Boolean)
              .join(' · ') || 'Không rõ nguồn'}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-6 sm:px-10 sm:py-8">
          <p className="font-serif text-lg leading-[1.85] whitespace-pre-wrap">
            {quote.text}
          </p>
          {quote.note && (
            <div className="mt-8 border-l-2 border-brand/50 pl-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Ghi chú
              </p>
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">
                {quote.note}
              </p>
            </div>
          )}
          {quote.tags.length > 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              {quote.tags.map((tag) => `#${tag}`).join('  ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 border-t px-4 py-3 sm:px-8">
          <Button variant="ghost" size="sm" onClick={onToggleFavorite}>
            <Heart className={cn(quote.favorite && 'fill-brand stroke-brand')} />
            {quote.favorite ? 'Đã yêu thích' : 'Yêu thích'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onCopy}>
            <Copy /> Sao chép
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil /> Sửa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
