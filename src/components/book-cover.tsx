import type { CSSProperties } from 'react'
import { LogoMark } from '@/components/logo-mark'
import { coverStyle } from '@/lib/cover'
import type { Playlist } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BookCoverProps {
  playlist: Pick<Playlist, 'title' | 'author' | 'color'>
  className?: string
  style?: CSSProperties
}

// Front cover of a playlist. Sized in em: set font-size on a parent to scale it.
export function BookCover({ playlist, className, style }: BookCoverProps) {
  return (
    <div
      className={cn('cover', className)}
      style={{ ...coverStyle(playlist.color), ...style }}
    >
      <div className="cover-frame">
        <LogoMark className="cover-mark" />
        <p className="cover-title">{playlist.title}</p>
        {/* Kept even when empty so the title stays in the same place. */}
        <p className="cover-author">{playlist.author || ' '}</p>
      </div>
    </div>
  )
}
