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
import { coverStyle } from '@/lib/cover'
import { MAX_TEXT_BYTES } from '@/lib/quote'
import type { Playlist, Quote, QuoteInput } from '@/lib/types'

interface QuoteFormProps {
  // null when adding a new quote.
  quote: Quote | null
  playlists: Playlist[]
  // Ticked by default for a new quote: the book it is being added from.
  defaultPlaylistId: string | null
  // Known book → author pairs, used for suggestions.
  books: Map<string, string>
  onSubmit: (input: QuoteInput) => void
  onClose: () => void
}

export function QuoteForm({
  quote,
  playlists,
  defaultPlaylistId,
  books,
  onSubmit,
  onClose,
}: QuoteFormProps) {
  const [playlistIds, setPlaylistIds] = useState<string[]>(
    quote?.playlistIds ?? (defaultPlaylistId ? [defaultPlaylistId] : []),
  )
  const [text, setText] = useState(quote?.text ?? '')
  const [book, setBook] = useState(quote?.book ?? '')
  const [author, setAuthor] = useState(quote?.author ?? '')

  // The book the form was opened from is listed first.
  const options = [...playlists].sort(
    (a, b) =>
      Number(b.id === defaultPlaylistId) - Number(a.id === defaultPlaylistId),
  )
  // Ids of playlists that no longer exist are dropped on save.
  const chosen = playlists.filter((p) => playlistIds.includes(p.id))
  const tooLong = new Blob([text]).size > MAX_TEXT_BYTES
  const canSubmit = text.trim().length > 0 && !tooLong && chosen.length > 0

  function togglePlaylist(id: string) {
    setPlaylistIds((current) =>
      current.includes(id)
        ? current.filter((other) => other !== id)
        : [...current, id],
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    onSubmit({
      playlistIds: chosen.map((p) => p.id),
      text: text.trim(),
      book: book.trim(),
      author: author.trim(),
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
            Mỗi trích dẫn bắt đầu ở một trang mới; đoạn dài sẽ tự tràn sang
            trang kế.
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
              className="max-h-[38vh] min-h-36 font-serif text-base leading-relaxed md:text-base"
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
              <Label htmlFor="quote-book">Sách gốc</Label>
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

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm leading-none font-medium">
              Playlist
              <span className="ml-2 font-normal text-muted-foreground">
                chọn một hoặc nhiều cuốn
              </span>
            </legend>
            <div className="grid max-h-40 gap-0.5 overflow-y-auto rounded-lg border border-input p-1 sm:grid-cols-2">
              {options.map((playlist) => (
                <label
                  key={playlist.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={playlistIds.includes(playlist.id)}
                    onChange={() => togglePlaylist(playlist.id)}
                    className="size-4 shrink-0 cursor-pointer rounded-[3px] accent-(--brand)"
                  />
                  <span
                    aria-hidden
                    style={coverStyle(playlist.color)}
                    className="h-4 w-3 shrink-0 rounded-[1px_2px_2px_1px] bg-(--cover)"
                  />
                  <span className="truncate">{playlist.title}</span>
                </label>
              ))}
            </div>
            {chosen.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Hãy chọn ít nhất một playlist.
              </p>
            )}
          </fieldset>

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
