import type { User } from 'firebase/auth'
import {
  ChevronDown,
  Download,
  Heart,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  UserRound,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { QuoteCard } from '@/components/quote-card'
import { QuoteForm } from '@/components/quote-form'
import { QuoteReader } from '@/components/quote-reader'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useQuotes } from '@/hooks/use-quotes'
import { setTheme, useTheme } from '@/hooks/use-theme'
import { downloadJson, toClipboardText } from '@/lib/quote'
import { buildIndex } from '@/lib/search'
import type { Quote, QuoteInput } from '@/lib/types'
import { cn } from '@/lib/utils'

const ALL_BOOKS = ''

interface LibraryProps {
  // null in local mode.
  user: User | null
  onSignOut: () => void
}

export function Library({ user, onSignOut }: LibraryProps) {
  const { quotes, loading, error, store } = useQuotes(user?.uid ?? null)
  const theme = useTheme()

  const [search, setSearch] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [book, setBook] = useState(ALL_BOOKS)
  const [tag, setTag] = useState<string | null>(null)

  // 'new' opens an empty form; a quote id opens that quote for editing.
  const [formTarget, setFormTarget] = useState<string | null>(null)
  const [readingId, setReadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const byId = useMemo(() => new Map(quotes.map((q) => [q.id, q])), [quotes])
  const index = useMemo(() => buildIndex(quotes), [quotes])

  const { authorByBook, countByBook } = useMemo(() => {
    const authorByBook = new Map<string, string>()
    const countByBook = new Map<string, number>()
    for (const q of quotes) {
      if (!q.book) continue
      countByBook.set(q.book, (countByBook.get(q.book) ?? 0) + 1)
      if (!authorByBook.get(q.book)) authorByBook.set(q.book, q.author)
    }
    return { authorByBook, countByBook }
  }, [quotes])

  const visible = useMemo(() => {
    const query = search.trim()
    const matched = query
      ? index
          .search(query)
          .map((result) => byId.get(result.id as string))
          .filter((q): q is Quote => q !== undefined)
      : [...quotes].sort((a, b) => b.createdAt - a.createdAt)
    return matched.filter(
      (q) =>
        (!favoritesOnly || q.favorite) &&
        (book === ALL_BOOKS || q.book === book) &&
        (tag === null || q.tags.includes(tag)),
    )
  }, [search, index, byId, quotes, favoritesOnly, book, tag])

  const reading = readingId ? byId.get(readingId) : undefined
  const deleting = deletingId ? byId.get(deletingId) : undefined
  const editing = formTarget && formTarget !== 'new' ? byId.get(formTarget) : null
  const isFiltering =
    search.trim() !== '' || favoritesOnly || book !== ALL_BOOKS || tag !== null

  // Writes are not awaited: Firestore applies them to the local cache right
  // away and only settles the promise once the server confirms.
  function run(action: Promise<void>, failure: string) {
    action.catch((err: Error) =>
      toast.error(failure, { description: err.message }),
    )
  }

  function handleSubmit(input: QuoteInput) {
    if (editing) {
      run(store.update(editing.id, input), 'Không lưu được thay đổi')
    } else {
      run(store.add(input), 'Không thêm được trích dẫn')
    }
    setFormTarget(null)
  }

  function toggleFavorite(quote: Quote) {
    run(
      store.update(quote.id, { favorite: !quote.favorite }),
      'Không cập nhật được',
    )
  }

  function copy(quote: Quote) {
    navigator.clipboard.writeText(toClipboardText(quote)).then(
      () => toast.success('Đã sao chép'),
      () => toast.error('Không sao chép được'),
    )
  }

  function confirmDelete() {
    if (!deleting) return
    run(store.remove(deleting.id), 'Không xoá được')
    setDeletingId(null)
    if (readingId === deleting.id) setReadingId(null)
  }

  function clearFilters() {
    setSearch('')
    setFavoritesOnly(false)
    setBook(ALL_BOOKS)
    setTag(null)
  }

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <h1 className="font-serif text-2xl font-medium tracking-tight max-sm:hidden">
            Margelle
          </h1>
          <div className="relative flex-1 sm:mx-4 sm:max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo nội dung, sách, tác giả, thẻ…"
              aria-label="Tìm trích dẫn"
              className="h-9 rounded-full bg-card pl-9"
            />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              size="lg"
              className="rounded-full px-4"
              onClick={() => setFormTarget('new')}
            >
              <Plus /> <span className="max-sm:hidden">Thêm trích dẫn</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Đổi giao diện sáng/tối"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Tài khoản"
                  className="overflow-hidden rounded-full"
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="size-full object-cover"
                    />
                  ) : (
                    <UserRound />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuLabel className="font-normal text-muted-foreground">
                  {user
                    ? (user.email ?? user.displayName)
                    : 'Chế độ cục bộ: dữ liệu chỉ nằm trên trình duyệt này'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={quotes.length === 0}
                  onSelect={() => downloadJson(quotes)}
                >
                  <Download /> Xuất tất cả ra JSON
                </DropdownMenuItem>
                {user && (
                  <DropdownMenuItem onSelect={onSignOut}>
                    <LogOut /> Đăng xuất
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {error && (
          <p className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Không tải được dữ liệu: {error.message}
          </p>
        )}

        {quotes.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              aria-pressed={favoritesOnly}
              onClick={() => setFavoritesOnly((value) => !value)}
            >
              <Heart
                className={cn(favoritesOnly && 'fill-brand stroke-brand')}
              />
              Yêu thích
            </Button>
            {countByBook.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="max-w-64 rounded-full">
                    <span className="truncate">
                      {book === ALL_BOOKS ? 'Tất cả sách' : book}
                    </span>
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-h-80 max-w-80 min-w-56"
                >
                  <DropdownMenuRadioGroup value={book} onValueChange={setBook}>
                    <DropdownMenuRadioItem value={ALL_BOOKS}>
                      Tất cả sách
                    </DropdownMenuRadioItem>
                    {[...countByBook]
                      .sort(([a], [b]) => a.localeCompare(b, 'vi'))
                      .map(([name, count]) => (
                        <DropdownMenuRadioItem key={name} value={name}>
                          <span className="truncate">{name}</span>
                          <span className="ml-auto pl-3 text-xs text-muted-foreground">
                            {count}
                          </span>
                        </DropdownMenuRadioItem>
                      ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {tag !== null && (
              <Button
                variant="secondary"
                className="rounded-full"
                onClick={() => setTag(null)}
                aria-label={`Bỏ lọc thẻ ${tag}`}
              >
                #{tag} <X />
              </Button>
            )}
            <p className="ml-auto text-sm text-muted-foreground">
              {isFiltering
                ? `${visible.length} / ${quotes.length} trích dẫn`
                : `${quotes.length} trích dẫn · ${countByBook.size} cuốn sách`}
            </p>
          </div>
        )}

        {loading ? (
          <p className="py-24 text-center font-serif text-muted-foreground italic">
            Đang mở tủ sách…
          </p>
        ) : quotes.length === 0 ? (
          <div className="mx-auto max-w-md py-24 text-center">
            <span
              aria-hidden
              className="font-serif text-7xl leading-[0.6] text-brand/50 select-none"
            >
              “
            </span>
            <h2 className="font-serif text-2xl font-medium">
              Chưa có trích dẫn nào
            </h2>
            <p className="mt-2 text-muted-foreground">
              Hãy bắt đầu bằng đoạn văn gần đây nhất khiến bạn dừng lại.
            </p>
            <Button
              size="lg"
              className="mt-6 rounded-full px-4"
              onClick={() => setFormTarget('new')}
            >
              <Plus /> Thêm trích dẫn đầu tiên
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-lg text-muted-foreground italic">
              Không tìm thấy trích dẫn nào khớp.
            </p>
            <Button variant="link" className="mt-2" onClick={clearFilters}>
              Xoá bộ lọc
            </Button>
          </div>
        ) : (
          <div className="columns-1 gap-5 md:columns-2 xl:columns-3">
            {visible.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onRead={() => setReadingId(quote.id)}
                onEdit={() => setFormTarget(quote.id)}
                onDelete={() => setDeletingId(quote.id)}
                onCopy={() => copy(quote)}
                onToggleFavorite={() => toggleFavorite(quote)}
                onPickTag={setTag}
              />
            ))}
          </div>
        )}
      </main>

      {reading && !formTarget && (
        <QuoteReader
          quote={reading}
          onClose={() => setReadingId(null)}
          onEdit={() => setFormTarget(reading.id)}
          onCopy={() => copy(reading)}
          onToggleFavorite={() => toggleFavorite(reading)}
        />
      )}

      {formTarget && (
        <QuoteForm
          key={formTarget}
          quote={editing ?? null}
          books={authorByBook}
          onSubmit={handleSubmit}
          onClose={() => setFormTarget(null)}
        />
      )}

      <AlertDialog
        open={deleting !== undefined}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá trích dẫn này?</AlertDialogTitle>
            <AlertDialogDescription>
              Trích dẫn sẽ bị xoá vĩnh viễn và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Xoá</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
