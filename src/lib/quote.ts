import type { Quote } from './types'

// Firestore caps a document at 1 MiB; leave headroom for the other fields.
export const MAX_TEXT_BYTES = 900_000

export function sourceOf(quote: Pick<Quote, 'book' | 'author' | 'page'>) {
  const source = [quote.book, quote.author].filter(Boolean).join(' — ')
  if (!quote.page) return source
  return source ? `${source} · tr. ${quote.page}` : `tr. ${quote.page}`
}

export function toClipboardText(quote: Quote) {
  const source = sourceOf(quote)
  return source ? `“${quote.text}”\n— ${source}` : quote.text
}

export function parseTags(value: string): string[] {
  const tags = value
    .split(',')
    .map((tag) => tag.trim().replace(/^#/, '').toLowerCase())
    .filter(Boolean)
  return [...new Set(tags)]
}

export function downloadJson(quotes: Quote[]) {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], {
    type: 'application/json',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `margelle-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(link.href)
}
