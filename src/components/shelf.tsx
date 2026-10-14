import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus } from 'lucide-react'
import type { CSSProperties } from 'react'
import { BookCover } from '@/components/book-cover'
import { coverStyle } from '@/lib/cover'
import type { Playlist } from '@/lib/types'

interface ShelfProps {
  playlists: Playlist[]
  quoteCounts: Map<string, number>
  // The book currently flying into the reader, if any.
  openingId: string | null
  // Whether books can be dragged to a new place.
  sortable: boolean
  // Name whose shelf each book is from (while exploring everyone's books).
  showOwner: boolean
  // Whether to offer the "Tạo playlist" slot.
  canCreate: boolean
  onReorder: (ids: string[]) => void
  onOpen: (playlistId: string) => void
  onCreate: () => void
}

// Thicker books for playlists with more quotes, within reason.
function thicknessOf(count: number) {
  return Math.min(34, 12 + count * 0.7)
}

export function Shelf({
  playlists,
  quoteCounts,
  openingId,
  sortable,
  showOwner,
  canCreate,
  onReorder,
  onOpen,
  onCreate,
}: ShelfProps) {
  const sensors = useSensors(
    // A short move starts a drag with the mouse; a plain click still opens the book.
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // On touch screens a press-and-hold starts it, so swiping still scrolls.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 8 },
    }),
  )
  const ids = playlists.map((playlist) => playlist.id)

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from >= 0 && to >= 0) onReorder(arrayMove(ids, from, to))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="shelf">
          {playlists.map((playlist) => (
            <ShelfBook
              key={playlist.id}
              playlist={playlist}
              count={quoteCounts.get(playlist.id) ?? 0}
              opening={openingId === playlist.id}
              sortable={sortable}
              showOwner={showOwner}
              onOpen={() => onOpen(playlist.id)}
            />
          ))}
          {canCreate && (
            <button type="button" className="shelf-slot" onClick={onCreate}>
              <span className="book-new">
                <Plus className="size-5" />
                Tạo playlist
              </span>
            </button>
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}

interface ShelfBookProps {
  playlist: Playlist
  count: number
  opening: boolean
  sortable: boolean
  showOwner: boolean
  onOpen: () => void
}

function ShelfBook({
  playlist,
  count,
  opening,
  sortable,
  showOwner,
  onOpen,
}: ShelfBookProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: playlist.id, disabled: !sortable })

  return (
    <button
      ref={setNodeRef}
      type="button"
      className="shelf-slot"
      data-dragging={isDragging ? '' : undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onClick={onOpen}
      {...attributes}
      {...listeners}
      aria-label={`Mở ${playlist.title}`}
    >
      <div
        className="book3d"
        style={
          {
            ...coverStyle(playlist.color),
            '--t': `${thicknessOf(count)}px`,
          } as CSSProperties
        }
      >
        <BookCover
          playlist={playlist}
          style={opening ? { viewTransitionName: 'opening-book' } : undefined}
        />
      </div>
      <span className="shelf-caption">
        <span className="shelf-label">
          <b>{playlist.title}</b>
          <span>
            {showOwner && `${playlist.ownerName} · `}
            {count} trích dẫn
          </span>
        </span>
      </span>
    </button>
  )
}
