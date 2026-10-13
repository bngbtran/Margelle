import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { useEffect, useState } from 'react'
import { resolveRole } from '@/lib/access'
import { auth } from '@/lib/firebase'
import type { Viewer } from '@/lib/types'

export type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  // Signed in, but not invited to the library.
  | { status: 'denied'; email: string | null }
  | { status: 'error'; message: string }
  | { status: 'ready'; viewer: Viewer; local: boolean }

const LOCAL_VIEWER: Viewer = {
  uid: 'local',
  name: 'Bạn',
  email: null,
  photoURL: null,
  role: 'owner',
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(
    auth
      ? { status: 'loading' }
      : { status: 'ready', viewer: LOCAL_VIEWER, local: true },
  )

  useEffect(() => {
    if (!auth) return
    let current = 0
    return onAuthStateChanged(auth, (user) => {
      const request = ++current
      if (!user) {
        setState({ status: 'signed-out' })
        return
      }
      setState({ status: 'loading' })
      resolveRole(user).then(
        (role) => {
          if (request !== current) return
          if (!role) {
            setState({ status: 'denied', email: user.email })
            return
          }
          setState({
            status: 'ready',
            local: false,
            viewer: {
              uid: user.uid,
              name: user.displayName || user.email || 'Ẩn danh',
              email: user.email,
              photoURL: user.photoURL,
              role,
            },
          })
        },
        (error: Error) => {
          if (request === current) {
            setState({ status: 'error', message: error.message })
          }
        },
      )
    })
  }, [])

  async function signIn() {
    if (auth) await signInWithPopup(auth, new GoogleAuthProvider())
  }

  async function signOut() {
    if (auth) await firebaseSignOut(auth)
  }

  return { state, signIn, signOut }
}
