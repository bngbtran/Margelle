import type { Quote } from './types'

// Gap between the CSS columns a long quote is flowed into; one column is one page.
export const COLUMN_GAP = 48
// How far the hard cover sticks out past the paper, in px.
export const COVER_OVERHANG = 5

export interface PageMetrics {
  // Two facing pages (desktop) or one page at a time (phone).
  spread: boolean
  pageW: number
  pageH: number
  fontSize: number
  padX: number
  headH: number
  footH: number
  contentW: number
  contentH: number
}

const TOOLBAR_H = 56
const CONTROLS_H = 68
const STAGE_MARGIN = 36

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function computeMetrics(viewportW: number, viewportH: number): PageMetrics {
  const availH = viewportH - TOOLBAR_H - CONTROLS_H - STAGE_MARGIN
  const spread = viewportW >= 860 && availH >= 360
  let pageW: number
  let pageH: number
  if (spread) {
    pageH = clamp(availH, 320, 780)
    pageW = Math.floor(pageH * 0.71)
    const maxW = Math.floor((viewportW - 120) / 2)
    if (pageW > maxW) {
      pageW = maxW
      pageH = Math.floor(pageW / 0.71)
    }
  } else {
    pageW = Math.max(220, Math.min(viewportW - 28, Math.floor(availH * 0.72), 520))
    pageH = Math.max(300, Math.min(availH, Math.floor(pageW / 0.66)))
  }
  const fontSize = clamp(Math.round(pageH / 38), 13, 19)
  const padX = Math.round(pageW * 0.115)
  const headH = Math.round(fontSize * 3.6)
  const footH = Math.round(fontSize * 3.6)
  return {
    spread,
    pageW,
    pageH,
    fontSize,
    padX,
    headH,
    footH,
    contentW: pageW - 2 * padX,
    contentH: pageH - headH - footH,
  }
}

export type Face =
  | { kind: 'cover' }
  | { kind: 'endpaper' }
  | { kind: 'title' }
  | { kind: 'empty' }
  | { kind: 'blank' }
  | { kind: 'back' }
  // `part` of `parts`: a long quote continues over several pages.
  | { kind: 'quote'; quote: Quote; part: number; parts: number; pageNo: number }

export interface Leaf {
  front: Face
  back: Face
}

export interface BookLayout {
  leaves: Leaf[]
  totalPages: number
  // How many leaves must be turned for a quote's first page to be visible.
  positionOf: Map<string, number>
}

export function layoutBook(
  quotes: Quote[],
  counts: Map<string, number>,
  spread: boolean,
): BookLayout {
  const pages: Face[] = []
  for (const quote of quotes) {
    const parts = counts.get(quote.id) ?? 1
    for (let part = 0; part < parts; part++) {
      pages.push({ kind: 'quote', quote, part, parts, pageNo: pages.length + 1 })
    }
  }
  const totalPages = pages.length
  const content: Face[] = pages.length > 0 ? pages : [{ kind: 'empty' }]
  const leaves: Leaf[] = []
  const positionOf = new Map<string, number>()

  if (!spread) {
    const faces: Face[] = [
      { kind: 'cover' },
      { kind: 'title' },
      ...content,
      { kind: 'back' },
    ]
    faces.forEach((front, index) => {
      leaves.push({ front, back: { kind: 'blank' } })
      if (front.kind === 'quote' && front.part === 0) {
        positionOf.set(front.quote.id, index)
      }
    })
    return { leaves, totalPages, positionOf }
  }

  const faces: Face[] = [
    { kind: 'cover' },
    { kind: 'endpaper' },
    { kind: 'title' },
    ...content,
  ]
  // The back cover must be the back of the last leaf.
  if (faces.length % 2 === 1) faces.push({ kind: 'blank' })
  faces.push({ kind: 'endpaper' }, { kind: 'back' })
  for (let i = 0; i < faces.length; i += 2) {
    leaves.push({ front: faces[i], back: faces[i + 1] })
  }
  faces.forEach((face, index) => {
    if (face.kind === 'quote' && face.part === 0) {
      // Even faces are right-hand pages, odd faces are left-hand pages.
      positionOf.set(face.quote.id, Math.ceil(index / 2))
    }
  })
  return { leaves, totalPages, positionOf }
}

export function tierOf(text: string): 'lg' | 'md' | 'base' {
  const lines = text.split('\n').length
  if (text.length <= 140 && lines <= 3) return 'lg'
  if (text.length <= 420 && lines <= 8) return 'md'
  return 'base'
}
