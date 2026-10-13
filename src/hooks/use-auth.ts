import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'

export type AuthState =
  | { status: 'loading' }
  | { status: 'local' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: User }

export function useAuth() {
  const [state, setState] = useState<AuthState>(
    auth ? { status: 'loading' } : { status: 'local' },
  )

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (user) =>
      setState(user ? { status: 'signed-in', user } : { status: 'signed-out' }),
    )
  }, [])

  async function signIn() {
    if (auth) await signInWithPopup(auth, new GoogleAuthProvider())
  }

  async function signOut() {
    if (auth) await firebaseSignOut(auth)
  }

  return { state, signIn, signOut }
}
