import {
  Download,
  Info,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Search,
  Sun,
  UserRound,
  Users,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { toast } from 'sonner'
import { AboutDialog } from '@/components/about-dialog'
import type { PageActions } from '@/components/book-pages'
import { BookReader } from '@/components/book-reader'
import { LogoMark } from '@/components/logo-mark'
import { MembersDialog } from '@/components/members-dialog'
import { PlaylistForm } from '@/components/playlist-form'
import { QuoteForm } from '@/components/quote-form'
import { Shelf } from '@/components/shelf'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useLibrary } from '@/hooks/use-library'
import {
  setThemePreference,
  useThemePreference,
  type ThemePreference,
} from '@/hooks/use-theme'
import { coverStyle } from '@/lib/cover'
import { downloadJson, sourceOf, toClipboardText } from '@/lib/quote'
import { buildIndex } from '@/lib/search'
import type { PlaylistInput, Quote, QuoteInput, Viewer } from '@/lib/types'

interface LibraryProps {
  viewer: Viewer
  // Local mode: no Firebase, everything stays in this browser.
  local: boolean
  onSignOut: () => void
}

const NEXT_THEME: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}
const THEME_LABEL: Record<ThemePreference, string> = {
  system: 'Giao diện: theo hệ thống',
  light: 'Giao diện: sáng',
  dark: 'Giao diện: tối',
}

// Animates between the shelf and the reader where the browser supports it.
function withTransition(update: () => void) {
  if (document.startViewTransition) {
    document.startViewTransition(() => flushSync(update))
  } else {
    update()
  }
}

export function Library({ viewer, local, onSignOut }: LibraryProps) {
  const { playlists, quotes, loading, error, store } = useLibrary(viewer, local)
  const themePreference = useThemePreference()

  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [targetQuoteId, setTargetQuoteId] = useState<string | null>(null)

  // 'new' opens an empty form; an id opens that item for editing.
  const [playlistForm, setPlaylistForm] = useState<string | null>(null)
  const [quoteForm, setQuoteForm] = useState<string | null>(null)
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null)
  const [deletingPlaylistId, setDeletingPlaylistId] = useState<string | null>(
    null,
  )
  const [membersOpen, setMembersOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)

  const quoteById = useMemo(() => new Map(quotes.map((q) => [q.id, q])), [quotes])
  const playlistById = useMemo(
    () => new Map(playlists.map((p) => [p.id, p])),
    [playlists],
  )
  const quotesByPlaylist = useMemo(() => {
    const groups = new Map<string, Quote[]>()
    for (const quote of quotes) {
      for (const playlistId of quote.playlistIds) {
        const group = groups.get(playlistId)
        if (group) group.push(quote)
        else groups.set(playlistId, [quote])
      }
    }
    return groups
  }, [quotes])
  const quoteCounts = useMemo(
    () => new Map([...quotesByPlaylist].map(([id, list]) => [id, list.length])),
    [quotesByPlaylist],
  )
  const authorByBook = useMemo(() => {
    const authors = new Map<string, string>()
    for (const q of quotes) {
      if (q.book && !authors.get(q.book)) authors.set(q.book, q.author)
    }
    return authors
  }, [quotes])
  const index = useMemo(() => buildIndex(quotes), [quotes])

  const query = search.trim()
  const results = useMemo(
    () =>
      query
        ? index
            .search(query)
            .map((result) => quoteById.get(result.id as string))
            .filter(
              (q): q is Quote =>
                q !== undefined &&
                q.playlistIds.some((id) => playlistById.has(id)),
            )
        : [],
    [query, index, quoteById, playlistById],
  )

  const openPlaylist = openId ? playlistById.get(openId) : undefined
  const editingPlaylist =
    playlistForm && playlistForm !== 'new' ? playlistById.get(playlistForm) : null
  const editingQuote =
    quoteForm && quoteForm !== 'new' ? quoteById.get(quoteForm) : null
  const deletingQuote = deletingQuoteId ? quoteById.get(deletingQuoteId) : undefined
  const deletingPlaylist = deletingPlaylistId
    ? playlistById.get(deletingPlaylistId)
    : undefined

  // Writes are not awaited: Firestore applies them to the local cache right
  // away and only settles the promise once the server confirms.
  function run(action: Promise<void>, failure: string) {
    action.catch((err: Error) =>
      toast.error(failure, { description: err.message }),
    )
  }

  function openBook(playlistId: string, quoteId: string | null = null) {
    // The cover has to be named before the transition takes its snapshot.
    flushSync(() => setOpeningId(playlistId))
    withTransition(() => {
      setOpenId(playlistId)
      setTargetQuoteId(quoteId)
    })
  }

  const closeBook = useCallback(() => {
    withTransition(() => {
      setOpenId(null)
      setTargetQuoteId(null)
    })
  }, [])

  const clearTarget = useCallback(() => setTargetQuoteId(null), [])

  function handlePlaylistSubmit(input: PlaylistInput) {
    if (editingPlaylist) {
      run(store.updatePlaylist(editingPlaylist.id, input), 'Không lưu được playlist')
    } else {
      const created = store.addPlaylist(input)
      run(created.saved, 'Không tạo được playlist')
    }
    setPlaylistForm(null)
  }

  function handleQuoteSubmit(input: QuoteInput) {
    if (editingQuote) {
      run(store.updateQuote(editingQuote.id, input), 'Không lưu được thay đổi')
      if (openId && input.playlistIds.includes(openId)) {
        setTargetQuoteId(editingQuote.id)
      }
    } else {
      const created = store.addQuote(input)
      run(created.saved, 'Không thêm được trích dẫn')
      // Stay in the current book when the quote was added to it.
      if (!openId || !input.playlistIds.includes(openId)) {
        setOpenId(input.playlistIds[0])
      }
      setTargetQuoteId(created.id)
    }
    setQuoteForm(null)
  }

  function confirmDeleteQuote() {
    if (!deletingQuote) return
    run(store.removeQuote(deletingQuote.id), 'Không xoá được trích dẫn')
    setDeletingQuoteId(null)
  }

  function confirmDeletePlaylist() {
    if (!deletingPlaylist) return
    run(
      store.removePlaylist(
        deletingPlaylist.id,
        quotesByPlaylist.get(deletingPlaylist.id) ?? [],
      ),
      'Không xoá được playlist',
    )
    setDeletingPlaylistId(null)
    if (openId === deletingPlaylist.id) setOpenId(null)
  }

  const actions: PageActions = {
    canEdit: (quote) =>
      viewer.role === 'owner' || quote.contributorUid === viewer.uid,
    onCopy: (quote) => {
      navigator.clipboard.writeText(toClipboardText(quote)).then(
        () => toast.success('Đã sao chép'),
        () => toast.error('Không sao chép được'),
      )
    },
    onEdit: (quote) => setQuoteForm(quote.id),
    onDelete: (quote) => setDeletingQuoteId(quote.id),
    onAdd: () => setQuoteForm('new'),
  }

  return (
    <div className="min-h-svh">
      {openPlaylist ? (
        <BookReader
          key={openPlaylist.id}
          playlist={openPlaylist}
          quotes={quotesByPlaylist.get(openPlaylist.id) ?? []}
          targetQuoteId={targetQuoteId}
          onTargetReached={clearTarget}
          canEditPlaylist={
            viewer.role === 'owner' || openPlaylist.ownerUid === viewer.uid
          }
          actions={actions}
          onClose={closeBook}
          onEditPlaylist={() => setPlaylistForm(openPlaylist.id)}
          onDeletePlaylist={() => setDeletingPlaylistId(openPlaylist.id)}
        />
      ) : (
        <>
          <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
              <LogoMark className="size-8 shrink-0 text-brand" />
              <h1 className="font-serif text-2xl font-medium tracking-tight max-sm:hidden">
                Margelle
              </h1>
              <div className="relative flex-1 sm:mx-4 sm:max-w-md">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm trong mọi cuốn sách…"
                  aria-label="Tìm trích dẫn"
                  className="h-9 rounded-full bg-card pl-9"
                />
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  size="lg"
                  className="rounded-full px-4"
                  onClick={() => setPlaylistForm('new')}
                >
                  <Plus /> <span className="max-sm:hidden">Tạo playlist</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label={THEME_LABEL[themePreference]}
                  title={`${THEME_LABEL[themePreference]} (bấm để đổi)`}
                  onClick={() => setThemePreference(NEXT_THEME[themePreference])}
                >
                  {themePreference === 'system' ? (
                    <Monitor />
                  ) : themePreference === 'dark' ? (
                    <Moon />
                  ) : (
                    <Sun />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      aria-label="Tài khoản"
                      className="overflow-hidden rounded-full"
                    >
                      {viewer.photoURL ? (
                        <img
                          src={viewer.photoURL}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="size-full object-cover"
                        />
                      ) : (
                        <UserRound />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-60">
                    <DropdownMenuLabel className="font-normal text-muted-foreground">
                      {local
                        ? 'Chế độ cục bộ: dữ liệu chỉ nằm trên trình duyệt này'
                        : `${viewer.email ?? viewer.name} · ${viewer.role === 'owner' ? 'chủ kệ sách' : 'người đóng góp'}`}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {viewer.role === 'owner' && !local && (
                      <DropdownMenuItem onSelect={() => setMembersOpen(true)}>
                        <Users /> Người đóng góp
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      disabled={quotes.length === 0}
                      onSelect={() => downloadJson(playlists, quotes)}
                    >
                      <Download /> Xuất tất cả ra JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setAboutOpen(true)}>
                      <Info /> Về chúng tôi
                    </DropdownMenuItem>
                    {!local && (
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

            {loading ? (
              <p className="py-24 text-center text-muted-foreground">
                Đang mở tủ sách…
              </p>
            ) : query ? (
              <section>
                <p className="mb-4 text-sm text-muted-foreground">
                  {results.length} trích dẫn khớp với “{query}”
                </p>
                <ul className="grid gap-3">
                  {results.map((quote) => {
                    const homes = quote.playlistIds
                      .map((id) => playlistById.get(id))
                      .filter((p) => p !== undefined)
                    return (
                      <li key={quote.id}>
                        <button
                          type="button"
                          onClick={() => openBook(homes[0].id, quote.id)}
                          className="w-full rounded-xl border bg-card p-4 text-left transition-shadow hover:shadow-md"
                        >
                          <p className="line-clamp-3 font-serif leading-relaxed whitespace-pre-wrap">
                            {quote.text}
                          </p>
                          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            {homes.map((playlist) => (
                              <span key={playlist.id} className="flex items-center gap-1.5">
                                <span
                                  style={coverStyle(playlist.color)}
                                  className="size-2.5 rounded-full bg-(--cover)"
                                />
                                {playlist.title}
                              </span>
                            ))}
                            {sourceOf(quote) && <span>— {sourceOf(quote)}</span>}
                          </p>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : (
              <>
                <Shelf
                  playlists={playlists}
                  quoteCounts={quoteCounts}
                  openingId={openingId}
                  onOpen={(id) => openBook(id)}
                  onCreate={() => setPlaylistForm('new')}
                />
                {playlists.length === 0 && (
                  <p className="mt-6 text-center text-muted-foreground">
                    Kệ sách còn trống. Hãy tạo playlist đầu tiên để bắt đầu lưu
                    trích dẫn.
                  </p>
                )}
              </>
            )}
          </main>
        </>
      )}

      {playlistForm && (
        <PlaylistForm
          key={playlistForm}
          playlist={editingPlaylist ?? null}
          onSubmit={handlePlaylistSubmit}
          onClose={() => setPlaylistForm(null)}
        />
      )}

      {quoteForm && (
        <QuoteForm
          key={quoteForm}
          quote={editingQuote ?? null}
          playlists={playlists}
          defaultPlaylistId={openId ?? (playlists.length === 1 ? playlists[0].id : null)}
          books={authorByBook}
          onSubmit={handleQuoteSubmit}
          onClose={() => setQuoteForm(null)}
        />
      )}

      {membersOpen && <MembersDialog onClose={() => setMembersOpen(false)} />}

      {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}

      <AlertDialog
        open={deletingQuote !== undefined}
        onOpenChange={(open) => !open && setDeletingQuoteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá trích dẫn này?</AlertDialogTitle>
            <AlertDialogDescription>
              Trích dẫn sẽ bị xoá vĩnh viễn khỏi mọi cuốn sách đang chứa nó.
              Nếu chỉ muốn gỡ khỏi cuốn này, hãy chọn Sửa rồi bỏ tick playlist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuote}>Xoá</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deletingPlaylist !== undefined}
        onOpenChange={(open) => !open && setDeletingPlaylistId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xoá playlist “{deletingPlaylist?.title}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cuốn sách sẽ bị xoá vĩnh viễn. Trích dẫn chỉ nằm trong cuốn này
              cũng bị xoá theo; trích dẫn còn nằm ở cuốn khác thì được giữ lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePlaylist}>
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
