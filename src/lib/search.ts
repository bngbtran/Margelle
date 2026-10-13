import MiniSearch from 'minisearch'
import type { Quote } from './types'

// Strip Vietnamese diacritics so "tinh yeu" also finds "tình yêu".
export function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
}

export function buildIndex(quotes: Quote[]): MiniSearch<Quote> {
  const index = new MiniSearch<Quote>({
    fields: ['text', 'book', 'author', 'contributorName'],
    processTerm: (term) => fold(term),
    searchOptions: {
      prefix: true,
      combineWith: 'AND',
      boost: { book: 2, author: 2 },
    },
  })
  index.addAll(quotes)
  return index
}
