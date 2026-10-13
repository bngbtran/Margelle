import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Quote, QuoteInput } from './types'

export interface QuoteStore {
  subscribe(
    onQuotes: (quotes: Quote[]) => void,
    onError: (error: Error) => void,
  ): () => void
  add(input: QuoteInput): Promise<void>
  update(id: string, patch: Partial<QuoteInput>): Promise<void>
  remove(id: string): Promise<void>
}

export function firestoreStore(uid: string): QuoteStore {
  if (!db) throw new Error('Firebase is not configured')
  const quotes = collection(db, 'users', uid, 'quotes')

  return {
    subscribe(onQuotes, onError) {
      return onSnapshot(
        query(quotes, orderBy('createdAt', 'desc')),
        (snapshot) =>
          onQuotes(
            snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Quote),
          ),
        onError,
      )
    },
    async add(input) {
      const now = Date.now()
      await addDoc(quotes, { ...input, createdAt: now, updatedAt: now })
    },
    async update(id, patch) {
      await updateDoc(doc(quotes, id), { ...patch, updatedAt: Date.now() })
    },
    async remove(id) {
      await deleteDoc(doc(quotes, id))
    },
  }
}

const LOCAL_KEY = 'margelle.quotes'

function readLocal(): Quote[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as Quote[]
  } catch {
    return []
  }
}

const localListeners = new Set<(quotes: Quote[]) => void>()

function writeLocal(quotes: Quote[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes))
  for (const listener of localListeners) listener(quotes)
}

// Used when no Firebase config is present: quotes stay in this browser only.
export const localStore: QuoteStore = {
  subscribe(onQuotes) {
    localListeners.add(onQuotes)
    onQuotes(readLocal())
    return () => {
      localListeners.delete(onQuotes)
    }
  },
  async add(input) {
    const now = Date.now()
    writeLocal([
      { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now },
      ...readLocal(),
    ])
  },
  async update(id, patch) {
    writeLocal(
      readLocal().map((q) =>
        q.id === id ? { ...q, ...patch, updatedAt: Date.now() } : q,
      ),
    )
  },
  async remove(id) {
    writeLocal(readLocal().filter((q) => q.id !== id))
  },
}
