import { useEffect, useMemo, useState } from 'react'
import { firestoreStore, localStore, migrateLegacyQuotes } from '@/lib/store'
import type { Playlist, Quote, Viewer } from '@/lib/types'

export function useLibrary(viewer: Viewer, local: boolean) {
  const store = useMemo(
    () => (local ? localStore(viewer) : firestoreStore(viewer)),
    [viewer, local],
  )
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null)
  const [quotes, setQuotes] = useState<Quote[] | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const stopPlaylists = store.subscribePlaylists(
      (next) =>
        setPlaylists([...next].sort((a, b) => a.createdAt - b.createdAt)),
      setError,
    )
    // Oldest first: that is the page order inside a book.
    const stopQuotes = store.subscribeQuotes(
      (next) => setQuotes([...next].sort((a, b) => a.createdAt - b.createdAt)),
      setError,
    )
    return () => {
      stopPlaylists()
      stopQuotes()
    }
  }, [store])

  useEffect(() => {
    if (!local) migrateLegacyQuotes(viewer).catch(() => {})
  }, [viewer, local])

  return {
    playlists: playlists ?? [],
    quotes: quotes ?? [],
    loading: (playlists === null || quotes === null) && !error,
    error,
    store,
  }
}
