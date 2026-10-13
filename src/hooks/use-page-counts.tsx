import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { QuoteFlow } from '@/components/quote-flow'
import { COLUMN_GAP, type PageMetrics } from '@/lib/book'
import type { Quote } from '@/lib/types'

// Covers the latin, latin-ext and vietnamese subsets so all of them are loaded
// before any text is measured.
const FONT_SAMPLE = 'aăđạỡő“—'

// Remembered across mounts so reopening a book can lay out immediately.
let fontsLoaded = false

function useFontsReady() {
  const [ready, setReady] = useState(fontsLoaded)
  useEffect(() => {
    if (fontsLoaded) return
    Promise.all([
      document.fonts.load('1em "Lora Variable"', FONT_SAMPLE),
      document.fonts.load('italic 1em "Lora Variable"', FONT_SAMPLE),
      document.fonts.load('1em "Be Vietnam Pro"', FONT_SAMPLE),
    ]).finally(() => {
      fontsLoaded = true
      setReady(true)
    })
  }, [])
  return ready
}

// Works out how many pages each quote takes at the current page size by
// laying it out off-screen. `measurer` must be rendered somewhere.
export function usePageCounts(quotes: Quote[], metrics: PageMetrics) {
  const fontsReady = useFontsReady()
  const [cache] = useState(() => new Map<string, number>())
  const [, setVersion] = useState(0)
  const host = useRef<HTMLDivElement>(null)

  const size = `${metrics.contentW}x${metrics.contentH}@${metrics.fontSize}`
  const keyOf = (quote: Quote) => `${quote.id}:${quote.updatedAt}:${size}`
  const missing = fontsReady ? quotes.filter((q) => !cache.has(keyOf(q))) : []
  const missingKeys = missing.map(keyOf).join('|')
  const pageStep = metrics.contentW + COLUMN_GAP

  useLayoutEffect(() => {
    if (!missingKeys || !host.current) return
    for (const cell of host.current.children) {
      const flow = cell.firstElementChild
      const end = cell.querySelector('[data-end]')
      const key = (cell as HTMLElement).dataset.key ?? ''
      const offset =
        flow && end
          ? end.getBoundingClientRect().left - flow.getBoundingClientRect().left
          : 0
      cache.set(key, Math.max(1, Math.floor((offset + 1) / pageStep) + 1))
    }
    setVersion((version) => version + 1)
  }, [missingKeys, cache, pageStep])

  const ready = fontsReady && missing.length === 0
  // Memoised so the book layout is only rebuilt when something changed.
  const counts = useMemo(
    () =>
      ready
        ? new Map(
            quotes.map((q) => [
              q.id,
              cache.get(`${q.id}:${q.updatedAt}:${size}`) ?? 1,
            ]),
          )
        : null,
    [ready, quotes, size, cache],
  )

  const measurer =
    missing.length > 0 ? (
      <div
        ref={host}
        aria-hidden
        className="page-measurer"
        style={{ fontSize: metrics.fontSize }}
      >
        {missing.map((quote) => (
          <div
            key={keyOf(quote)}
            data-key={keyOf(quote)}
            style={{
              width: metrics.contentW,
              height: metrics.contentH,
              overflow: 'hidden',
            }}
          >
            <QuoteFlow quote={quote} metrics={metrics} />
          </div>
        ))}
      </div>
    ) : null

  return { counts, measurer }
}
