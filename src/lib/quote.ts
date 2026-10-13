import type { Playlist, Quote } from './types'

// Firestore caps a document at 1 MiB; leave headroom for the other fields.
export const MAX_TEXT_BYTES = 900_000

export function sourceOf(quote: Pick<Quote, 'book' | 'author'>) {
  return [quote.book, quote.author].filter(Boolean).join(' — ')
}

export function toClipboardText(quote: Quote) {
  const source = sourceOf(quote)
  return source ? `“${quote.text}”\n— ${source}` : quote.text
}

export function downloadJson(playlists: Playlist[], quotes: Quote[]) {
  const blob = new Blob([JSON.stringify({ playlists, quotes }, null, 2)], {
    type: 'application/json',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `margelle-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(link.href)
}
