import { Check } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { BookCover } from '@/components/book-cover'
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
import {
  COVER_PRESETS,
  DEFAULT_COVER,
  coverHex,
  coverStyle,
  isHexColor,
} from '@/lib/cover'
import type { Playlist, PlaylistInput } from '@/lib/types'

interface PlaylistFormProps {
  // null when creating a new playlist.
  playlist: Playlist | null
  onSubmit: (input: PlaylistInput) => void
  onClose: () => void
}

export function PlaylistForm({
  playlist,
  onSubmit,
  onClose,
}: PlaylistFormProps) {
  const [title, setTitle] = useState(playlist?.title ?? '')
  const [author, setAuthor] = useState(playlist?.author ?? '')
  const [description, setDescription] = useState(playlist?.description ?? '')
  const [color, setColor] = useState(
    playlist ? coverHex(playlist.color) : DEFAULT_COVER,
  )
  // What is typed in the hex box; only applied once it is a full #rrggbb.
  const [hexDraft, setHexDraft] = useState(color)
  const canSubmit = title.trim().length > 0

  function pickColor(value: string) {
    setColor(value.toLowerCase())
    setHexDraft(value.toLowerCase())
  }

  function handleHexChange(value: string) {
    const next = value.startsWith('#') ? value : `#${value}`
    setHexDraft(next)
    if (isHexColor(next)) setColor(next.toLowerCase())
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    onSubmit({
      title: title.trim(),
      author: author.trim(),
      description: description.trim(),
      color,
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            {playlist ? 'Sửa playlist' : 'Tạo playlist'}
          </DialogTitle>
          <DialogDescription>
            Mỗi playlist là một cuốn sách trên kệ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="flex gap-5">
            <BookCover
              playlist={{
                title: title.trim() || 'Tên playlist',
                author: author.trim(),
                color,
              }}
              className="h-[170px] w-[120px] shrink-0 rounded-[2px_4px_4px_2px] text-[8px] shadow-lg max-sm:hidden"
            />
            <div className="grid flex-1 content-start gap-4">
              <div className="grid gap-2">
                <Label htmlFor="playlist-title">Tên</Label>
                <Input
                  id="playlist-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="playlist-author">Tác giả (tuỳ chọn)</Label>
                <Input
                  id="playlist-author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  maxLength={80}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="playlist-description">Lời đề (tuỳ chọn)</Label>
                <Textarea
                  id="playlist-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={300}
                  className="max-h-28"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Màu bìa</Label>
            <div className="flex flex-wrap gap-2">
              {COVER_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.name}
                  aria-label={preset.name}
                  aria-pressed={color === preset.value}
                  onClick={() => pickColor(preset.value)}
                  style={coverStyle(preset.value)}
                  className="flex size-8 items-center justify-center rounded-full border border-foreground/15 bg-(--cover) text-(--cover-ink) ring-offset-2 ring-offset-popover outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:ring-2 aria-pressed:ring-foreground/60"
                >
                  {color === preset.value && <Check className="size-4" />}
                </button>
              ))}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => pickColor(e.target.value)}
                aria-label="Chọn màu tuỳ ý"
                className="h-8 w-12 shrink-0 cursor-pointer rounded-lg border border-input bg-transparent p-0.5"
              />
              <Input
                value={hexDraft}
                onChange={(e) => handleHexChange(e.target.value)}
                maxLength={7}
                spellCheck={false}
                autoComplete="off"
                aria-label="Mã màu hex"
                aria-invalid={!isHexColor(hexDraft)}
                className="w-28 font-mono"
              />
              <span className="text-sm text-muted-foreground">
                Màu tuỳ ý: bấm ô màu hoặc gõ mã hex
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {playlist ? 'Lưu thay đổi' : 'Tạo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
