export interface Quote {
  id: string
  text: string
  book: string
  author: string
  page: string
  tags: string[]
  note: string
  favorite: boolean
  createdAt: number
  updatedAt: number
}

export type QuoteInput = Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>
