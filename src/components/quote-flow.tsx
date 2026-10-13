import { COLUMN_GAP, tierOf, type PageMetrics } from '@/lib/book'
import type { Quote } from '@/lib/types'

interface QuoteFlowProps {
  quote: Quote
  metrics: PageMetrics
  // Omit both while measuring how many pages the quote needs.
  part?: number
  parts?: number
}

// The text of one quote. Long quotes are flowed into CSS columns that are each
// exactly one page wide, and every page shows one column of that flow.
export function QuoteFlow({ quote, metrics, part = 0, parts }: QuoteFlowProps) {
  const hasSource = Boolean(quote.author || quote.book)
  // The empty marker tells the measurer in which column the quote ends.
  const end = <span data-end />
  const body = (
    <>
      <span className="quote-open" aria-hidden>
        “
      </span>
      <p className="quote-text">
        {quote.text}
        {!hasSource && end}
      </p>
      {hasSource && (
        <p className="quote-source">
          {quote.author && (
            <span className="quote-author">- {quote.author} -</span>
          )}
          {quote.book && <span className="quote-book">{quote.book}</span>}
          {end}
        </p>
      )}
    </>
  )

  if (parts === 1) {
    return (
      <div className="quote-flow" data-tier={tierOf(quote.text)}>
        {body}
      </div>
    )
  }

  return (
    <div
      className="quote-flow"
      data-tier={tierOf(quote.text)}
      style={{
        width: metrics.contentW,
        height: metrics.contentH,
        columnWidth: metrics.contentW,
        columnGap: COLUMN_GAP,
        columnFill: 'auto',
        transform: part
          ? `translateX(-${part * (metrics.contentW + COLUMN_GAP)}px)`
          : undefined,
      }}
    >
      {body}
    </div>
  )
}
