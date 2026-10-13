import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MAX_TEXT_BYTES, parseTags } from '@/lib/quote'
import type { Quote, QuoteInput } from '@/lib/types'

interface QuoteFormProps {
  // null when adding a new quote.
  quote: Quote | null
  // Known book → author pairs, used for suggestions.
  books: Map<string, string>
  onSubmit: (input: QuoteInput) => void
  onClose: () => void
}

export function QuoteForm({ quote, books, onSubmit, onClose }: QuoteFormProps) {
  const [text, setText] = useState(quote?.text ?? '')
  const [book, setBook] = useState(quote?.book ?? '')
  const [author, setAuthor] = useState(quote?.author ?? '')
  const [page, setPage] = useState(quote?.page ?? '')
  const [tags, setTags] = useState(quote?.tags.join(', ') ?? '')
  const [note, setNote] = useState(quote?.note ?? '')

  const tooLong = new Blob([text]).size > MAX_TEXT_BYTES
  const canSubmit = text.trim().length > 0 && !tooLong

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    onSubmit({
      text: text.trim(),
      book: book.trim(),
      author: author.trim(),
      page: page.trim(),
      tags: parseTags(tags),
      note: note.trim(),
      favorite: quote?.favorite ?? false,
    })
  }

  function fillAuthorFromBook() {
    const known = books.get(book.trim())
    if (known && !author.trim()) setAuthor(known)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            {quote ? 'Sửa trích dẫn' : 'Thêm trích dẫn'}
          </DialogTitle>
          <DialogDescription>
            Chỉ cần nội dung là đủ, các ô còn lại có thể để trống.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="quote-text">Nội dung</Label>
            <Textarea
              id="quote-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Dán hoặc gõ đoạn trích…"
              autoFocus
              aria-invalid={tooLong}
              className="max-h-[42vh] min-h-36 font-serif text-base leading-relaxed md:text-base"
            />
            {tooLong && (
              <p className="text-sm text-destructive">
                Đoạn trích vượt giới hạn khoảng 900 KB cho một mục. Hãy tách
                thành nhiều trích dẫn.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="quote-book">Sách</Label>
              <Input
                id="quote-book"
                value={book}
                onChange={(e) => setBook(e.target.value)}
                onBlur={fillAuthorFromBook}
                list="known-books"
                autoComplete="off"
              />
              <datalist id="known-books">
                {[...books.keys()].map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quote-author">Tác giả</Label>
              <Input
                id="quote-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                list="known-authors"
                autoComplete="off"
              />
              <datalist id="known-authors">
                {[...new Set(books.values())].filter(Boolean).map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
            <div className="grid gap-2">
              <Label htmlFor="quote-page">Trang</Label>
              <Input
                id="quote-page"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quote-tags">Thẻ</Label>
              <Input
                id="quote-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="cách nhau bằng dấu phẩy"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quote-note">Ghi chú</Label>
            <Textarea
              id="quote-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Vì sao bạn muốn giữ lại đoạn này?"
              className="max-h-40"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {quote ? 'Lưu thay đổi' : 'Thêm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
