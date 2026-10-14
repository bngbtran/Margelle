import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  Playlist,
  PlaylistInput,
  Quote,
  QuoteInput,
  Viewer,
} from './types'

// `id` is known immediately; `saved` settles once the write is confirmed.
export interface Created {
  id: string
  saved: Promise<void>
}

export interface LibraryStore {
  subscribePlaylists(
    onData: (playlists: Playlist[]) => void,
    onError: (error: Error) => void,
  ): () => void
  subscribeQuotes(
    onData: (quotes: Quote[]) => void,
    onError: (error: Error) => void,
  ): () => void
  addPlaylist(input: PlaylistInput): Created
  updatePlaylist(id: string, patch: Partial<PlaylistInput>): Promise<void>
  // `quotes` are the quotes currently printed in that playlist.
  removePlaylist(id: string, quotes: Quote[]): Promise<void>
  addQuote(input: QuoteInput): Created
  updateQuote(id: string, patch: Partial<QuoteInput>): Promise<void>
  removeQuote(id: string): Promise<void>
  // The viewer's own arrangement of the shelf: playlist ids, left to right.
  subscribeShelfOrder(onData: (ids: string[]) => void): () => void
  saveShelfOrder(ids: string[]): Promise<void>
}

// Firestore allows 500 writes per batch.
const BATCH_SIZE = 400

type Stored = Record<string, unknown>

// Quotes written before multi-playlist support hold a single `playlistId`.
function toQuote(data: Stored, id: string): Quote {
  const playlistIds = Array.isArray(data.playlistIds)
    ? (data.playlistIds as string[])
    : typeof data.playlistId === 'string'
      ? [data.playlistId]
      : []
  return {
    id,
    playlistIds,
    text: String(data.text ?? ''),
    book: String(data.book ?? ''),
    author: String(data.author ?? ''),
    contributorUid: String(data.contributorUid ?? ''),
    contributorName: String(data.contributorName ?? ''),
    createdAt: Number(data.createdAt ?? 0),
    updatedAt: Number(data.updatedAt ?? 0),
  }
}

function toPlaylist(data: Stored, id: string): Playlist {
  return {
    id,
    title: String(data.title ?? ''),
    author: String(data.author ?? ''),
    description: String(data.description ?? ''),
    color: String(data.color ?? ''),
    ownerUid: String(data.ownerUid ?? ''),
    ownerName: String(data.ownerName ?? ''),
    createdAt: Number(data.createdAt ?? 0),
    updatedAt: Number(data.updatedAt ?? 0),
  }
}

// A quote can only be changed or deleted by the person who contributed it.
function canEdit(viewer: Viewer, quote: Quote) {
  return quote.contributorUid === viewer.uid
}

export function firestoreStore(viewer: Viewer): LibraryStore {
  if (!db) throw new Error('Firebase is not configured')
  const firestore = db
  const playlists = collection(firestore, 'playlists')
  const quotes = collection(firestore, 'quotes')
  const preferences = doc(firestore, 'users', viewer.uid)

  return {
    subscribePlaylists(onData, onError) {
      return onSnapshot(
        playlists,
        (snapshot) =>
          onData(snapshot.docs.map((d) => toPlaylist(d.data(), d.id))),
        onError,
      )
    },
    subscribeQuotes(onData, onError) {
      return onSnapshot(
        quotes,
        (snapshot) => onData(snapshot.docs.map((d) => toQuote(d.data(), d.id))),
        onError,
      )
    },
    addPlaylist(input) {
      const ref = doc(playlists)
      const now = Date.now()
      const saved = setDoc(ref, {
        ...input,
        ownerUid: viewer.uid,
        ownerName: viewer.name,
        createdAt: now,
        updatedAt: now,
      })
      return { id: ref.id, saved }
    },
    async updatePlaylist(id, patch) {
      await updateDoc(doc(playlists, id), { ...patch, updatedAt: Date.now() })
    },
    async removePlaylist(id, inPlaylist) {
      // Quotes that also live in another book stay there. The caller only
      // deletes a playlist once nobody else's quotes are left in it.
      const editable = inPlaylist.filter((quote) => canEdit(viewer, quote))
      for (let i = 0; i < editable.length; i += BATCH_SIZE) {
        const batch = writeBatch(firestore)
        for (const quote of editable.slice(i, i + BATCH_SIZE)) {
          const remaining = quote.playlistIds.filter((other) => other !== id)
          if (remaining.length > 0) {
            batch.update(doc(quotes, quote.id), { playlistIds: remaining })
          } else {
            batch.delete(doc(quotes, quote.id))
          }
        }
        await batch.commit()
      }
      await deleteDoc(doc(playlists, id))
    },
    addQuote(input) {
      const ref = doc(quotes)
      const now = Date.now()
      const saved = setDoc(ref, {
        ...input,
        contributorUid: viewer.uid,
        contributorName: viewer.name,
        createdAt: now,
        updatedAt: now,
      })
      return { id: ref.id, saved }
    },
    async updateQuote(id, patch) {
      await updateDoc(doc(quotes, id), { ...patch, updatedAt: Date.now() })
    },
    async removeQuote(id) {
      await deleteDoc(doc(quotes, id))
    },
    subscribeShelfOrder(onData) {
      return onSnapshot(
        preferences,
        (snapshot) => {
          const ids = snapshot.data()?.shelfOrder
          onData(Array.isArray(ids) ? (ids as string[]) : [])
        },
        // Without a saved arrangement the shelf falls back to creation order.
        () => onData([]),
      )
    },
    async saveShelfOrder(ids) {
      await setDoc(preferences, { shelfOrder: ids }, { merge: true })
    },
  }
}

const MIGRATED_KEY = 'margelle.migrated.'

// Before playlists existed, quotes lived privately under users/{uid}/quotes.
// Move any that are left into one playlist so they show up on the shelf.
export async function migrateLegacyQuotes(viewer: Viewer): Promise<void> {
  if (!db || localStorage.getItem(MIGRATED_KEY + viewer.uid)) return
  const legacy = await getDocs(collection(db, 'users', viewer.uid, 'quotes'))
  if (!legacy.empty) {
    const now = Date.now()
    const playlist = doc(collection(db, 'playlists'))
    await setDoc(playlist, {
      title: 'Trích dẫn đầu tiên',
      author: '',
      description: '',
      color: '#a9522d',
      ownerUid: viewer.uid,
      ownerName: viewer.name,
      createdAt: now,
      updatedAt: now,
    })
    for (let i = 0; i < legacy.docs.length; i += BATCH_SIZE / 2) {
      const batch = writeBatch(db)
      for (const old of legacy.docs.slice(i, i + BATCH_SIZE / 2)) {
        const data = old.data()
        batch.set(doc(db, 'quotes', old.id), {
          playlistIds: [playlist.id],
          text: String(data.text ?? ''),
          book: String(data.book ?? ''),
          author: String(data.author ?? ''),
          contributorUid: viewer.uid,
          contributorName: viewer.name,
          createdAt: Number(data.createdAt ?? now),
          updatedAt: now,
        })
        batch.delete(old.ref)
      }
      await batch.commit()
    }
  }
  localStorage.setItem(MIGRATED_KEY + viewer.uid, '1')
}

const LOCAL_SHELF_ORDER = 'margelle.local.shelfOrder'
const LOCAL_PLAYLISTS = 'margelle.local.playlists'
const LOCAL_QUOTES = 'margelle.local.quotes'

function createLocalTable<T extends { id: string }>(
  key: string,
  parse: (row: Stored) => T,
) {
  const listeners = new Set<(rows: T[]) => void>()
  function read(): T[] {
    try {
      const rows = JSON.parse(localStorage.getItem(key) ?? '[]') as Stored[]
      return rows.map(parse)
    } catch {
      return []
    }
  }
  function write(rows: T[]) {
    localStorage.setItem(key, JSON.stringify(rows))
    for (const listener of listeners) listener(rows)
  }
  function subscribe(onData: (rows: T[]) => void) {
    listeners.add(onData)
    onData(read())
    return () => {
      listeners.delete(onData)
    }
  }
  return { read, write, subscribe }
}

const localPlaylists = createLocalTable<Playlist>(LOCAL_PLAYLISTS, (row) =>
  toPlaylist(row, String(row.id)),
)
const localQuotes = createLocalTable<Quote>(LOCAL_QUOTES, (row) =>
  toQuote(row, String(row.id)),
)

// Used when no Firebase config is present: everything stays in this browser.
export function localStore(viewer: Viewer): LibraryStore {
  return {
    subscribePlaylists: (onData) => localPlaylists.subscribe(onData),
    subscribeQuotes: (onData) => localQuotes.subscribe(onData),
    addPlaylist(input) {
      const id = crypto.randomUUID()
      const now = Date.now()
      localPlaylists.write([
        ...localPlaylists.read(),
        {
          ...input,
          id,
          ownerUid: viewer.uid,
          ownerName: viewer.name,
          createdAt: now,
          updatedAt: now,
        },
      ])
      return { id, saved: Promise.resolve() }
    },
    async updatePlaylist(id, patch) {
      localPlaylists.write(
        localPlaylists
          .read()
          .map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p,
          ),
      )
    },
    async removePlaylist(id) {
      localQuotes.write(
        localQuotes
          .read()
          .map((q) => ({
            ...q,
            playlistIds: q.playlistIds.filter((other) => other !== id),
          }))
          .filter((q) => q.playlistIds.length > 0),
      )
      localPlaylists.write(localPlaylists.read().filter((p) => p.id !== id))
    },
    addQuote(input) {
      const id = crypto.randomUUID()
      const now = Date.now()
      localQuotes.write([
        ...localQuotes.read(),
        {
          ...input,
          id,
          contributorUid: viewer.uid,
          contributorName: viewer.name,
          createdAt: now,
          updatedAt: now,
        },
      ])
      return { id, saved: Promise.resolve() }
    },
    async updateQuote(id, patch) {
      localQuotes.write(
        localQuotes
          .read()
          .map((q) =>
            q.id === id ? { ...q, ...patch, updatedAt: Date.now() } : q,
          ),
      )
    },
    async removeQuote(id) {
      localQuotes.write(localQuotes.read().filter((q) => q.id !== id))
    },
    subscribeShelfOrder(onData) {
      try {
        onData(JSON.parse(localStorage.getItem(LOCAL_SHELF_ORDER) ?? '[]'))
      } catch {
        onData([])
      }
      return () => {}
    },
    async saveShelfOrder(ids) {
      localStorage.setItem(LOCAL_SHELF_ORDER, JSON.stringify(ids))
    },
  }
}
