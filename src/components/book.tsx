import {
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import {
  COVER_OVERHANG,
  type Face,
  type Leaf,
  type PageMetrics,
} from '@/lib/book'
import { coverStyle } from '@/lib/cover'

export type Side = 'left' | 'right'

interface BookProps {
  leaves: Leaf[]
  // Number of leaves already turned to the left.
  position: number
  metrics: PageMetrics
  color: string
  // Render nothing but the cover leaf, so no page can show through or around
  // the cover while the book is flying in from the shelf.
  coverOnly: boolean
  onNext: () => void
  onPrev: () => void
  renderFace: (face: Face, side: Side) => ReactNode
}

// Only the top few leaves on each side can be seen, so only those are mounted.
const VISIBLE_DEPTH = 2
const SWIPE_DISTANCE = 48

function isHard(face: Face) {
  return face.kind === 'cover' || face.kind === 'back' || face.kind === 'endpaper'
}

export function Book({
  leaves,
  position,
  metrics,
  color,
  coverOnly,
  onNext,
  onPrev,
  renderFace,
}: BookProps) {
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  const state =
    position === 0 ? 'front' : position >= leaves.length ? 'back' : 'open'

  function handlePointerDown(event: PointerEvent) {
    swiped.current = false
    swipeStart.current =
      event.pointerType === 'mouse'
        ? null
        : { x: event.clientX, y: event.clientY }
  }

  function handlePointerUp(event: PointerEvent) {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return
    swiped.current = true
    if (dx < 0) onNext()
    else onPrev()
  }

  function handleFaceClick(event: MouseEvent<HTMLDivElement>, side: Side) {
    // Let people select text, and do not turn twice after a swipe.
    if (swiped.current || window.getSelection()?.toString()) return
    if (side === 'left') {
      onPrev()
      return
    }
    if (!metrics.spread) {
      const box = event.currentTarget.getBoundingClientRect()
      if (event.clientX - box.left < box.width * 0.3) {
        onPrev()
        return
      }
    }
    onNext()
  }

  return (
    <div
      className="book-clip"
      data-mode={metrics.spread ? 'spread' : 'single'}
      style={
        {
          '--leaf-w': `${metrics.pageW + COVER_OVERHANG}px`,
          '--leaf-h': `${metrics.pageH + COVER_OVERHANG * 2}px`,
          fontSize: metrics.fontSize,
        } as CSSProperties
      }
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div className="book" data-state={state} style={coverStyle(color)}>
        <div className="book-board" />
        {leaves.map((leaf, index) => {
          const flipped = index < position
          const depth = flipped ? position - 1 - index : index - position
          if (depth > VISIBLE_DEPTH || (coverOnly && index > 0)) return null
          return (
            <BookLeaf key={index} flipped={flipped} depth={depth}>
              <div
                className="face"
                data-side="right"
                data-hard={isHard(leaf.front) ? '' : undefined}
                data-paper={isHard(leaf.front) ? undefined : ''}
                // The cover the shelf-to-reader transition lands on.
                style={
                  coverOnly ? { viewTransitionName: 'opening-book' } : undefined
                }
                onClick={(event) => handleFaceClick(event, 'right')}
              >
                {renderFace(leaf.front, 'right')}
                <div className="face-shade" />
              </div>
              <div
                className="face"
                data-side="left"
                data-hard={isHard(leaf.back) ? '' : undefined}
                data-paper={isHard(leaf.back) ? undefined : ''}
                hidden={coverOnly}
                onClick={(event) => handleFaceClick(event, 'left')}
              >
                {renderFace(leaf.back, 'left')}
                <div className="face-shade" />
              </div>
            </BookLeaf>
          )
        })}
      </div>
    </div>
  )
}

interface BookLeafProps {
  flipped: boolean
  // 0 for the top leaf of its pile, growing for the ones underneath.
  depth: number
  children: ReactNode
}

function BookLeaf({ flipped, depth, children }: BookLeafProps) {
  const [seen, setSeen] = useState(flipped)
  const [moving, setMoving] = useState(false)
  // Set once the leaf has turned at least once, so that leaves do not play
  // the turning shade when they are merely mounted.
  const [turned, setTurned] = useState(false)
  if (seen !== flipped) {
    setSeen(flipped)
    setMoving(true)
    setTurned(true)
  }

  return (
    <div
      className="leaf"
      data-turn={turned ? (flipped ? 'a' : 'b') : undefined}
      style={{
        // A leaf in the air must stay above both piles.
        zIndex: moving ? 100 : 50 - depth,
        transform: `translateZ(${-depth * 0.5}px) rotateY(${flipped ? -180 : 0}deg)`,
      }}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget) setMoving(false)
      }}
    >
      {children}
    </div>
  )
}
