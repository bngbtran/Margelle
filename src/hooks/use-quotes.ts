import { useEffect, useMemo, useState } from 'react'
import { firestoreStore, localStore } from '@/lib/store'
import type { Quote } from '@/lib/types'

// uid === null means local mode.
export function useQuotes(uid: string | null) {
  const store = useMemo(() => (uid ? firestoreStore(uid) : localStore), [uid])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(
    () =>
      store.subscribe(
        (next) => {
          setQuotes(next)
          setLoading(false)
          setError(null)
        },
        (err) => {
          setError(err)
          setLoading(false)
        },
      ),
    [store],
  )

  return { quotes, loading, error, store }
}
