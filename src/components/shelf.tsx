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
  onOpen,
  onCreate,
}: ShelfProps) {
  return (
    <div className="shelf">
      {playlists.map((playlist) => {
        const count = quoteCounts.get(playlist.id) ?? 0
        return (
          <button
            key={playlist.id}
            type="button"
            className="shelf-slot"
            onClick={() => onOpen(playlist.id)}
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
                style={
                  openingId === playlist.id
                    ? { viewTransitionName: 'opening-book' }
                    : undefined
                }
              />
            </div>
            <span className="shelf-caption">
              <b>{playlist.title}</b>
              {count} trích dẫn
            </span>
          </button>
        )
      })}
      <button type="button" className="shelf-slot" onClick={onCreate}>
        <span className="book-new">
          <Plus className="size-5" />
          Tạo playlist
        </span>
      </button>
    </div>
  )
}
