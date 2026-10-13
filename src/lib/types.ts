// A playlist is shown as one book on the shelf.
export interface Playlist {
  id: string
  title: string
  // Optional; printed under the title on the cover and the title page.
  author: string
  description: string
  // Cover colour as #rrggbb (older playlists may still hold a preset name).
  color: string
  ownerUid: string
  ownerName: string
  createdAt: number
  updatedAt: number
}

export interface Quote {
  id: string
  // Every book this quote is printed in.
  playlistIds: string[]
  text: string
  book: string
  author: string
  contributorUid: string
  contributorName: string
  createdAt: number
  updatedAt: number
}

export type PlaylistInput = Pick<
  Playlist,
  'title' | 'author' | 'description' | 'color'
>
export type QuoteInput = Pick<
  Quote,
  'playlistIds' | 'text' | 'book' | 'author'
>

export type Role = 'owner' | 'member'

export interface Viewer {
  uid: string
  name: string
  email: string | null
  photoURL: string | null
  role: Role
}

export interface Member {
  email: string
  addedAt: number
}
