import type { User } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Member, Role } from './types'

const ROLE_KEY = 'margelle.role.'

// The first account to sign in claims the library; everyone else needs an
// invitation (a document in `members` keyed by their e-mail address).
export async function resolveRole(user: User): Promise<Role | null> {
  if (!db) return 'owner'
  try {
    const role = await fetchRole(user)
    if (role) localStorage.setItem(ROLE_KEY + user.uid, role)
    else localStorage.removeItem(ROLE_KEY + user.uid)
    return role
  } catch (error) {
    // Offline: fall back to what this account was the last time we checked.
    const cached = localStorage.getItem(ROLE_KEY + user.uid)
    if (cached === 'owner' || cached === 'member') return cached
    throw error
  }
}

async function fetchRole(user: User): Promise<Role | null> {
  if (!db) return 'owner'
  const libraryRef = doc(db, 'config', 'library')
  let library = await getDoc(libraryRef)
  if (!library.exists()) {
    try {
      await setDoc(libraryRef, { ownerUid: user.uid, createdAt: Date.now() })
      return 'owner'
    } catch {
      // Someone else claimed it first.
      library = await getDoc(libraryRef)
    }
  }
  if (library.data()?.ownerUid === user.uid) return 'owner'
  if (!user.email) return null
  const member = await getDoc(doc(db, 'members', user.email.toLowerCase()))
  return member.exists() ? 'member' : null
}

export function subscribeMembers(
  onData: (members: Member[]) => void,
  onError: (error: Error) => void,
) {
  if (!db) return () => {}
  return onSnapshot(
    collection(db, 'members'),
    (snapshot) =>
      onData(
        snapshot.docs
          .map((d) => ({ email: d.id, addedAt: Number(d.data().addedAt ?? 0) }))
          .sort((a, b) => a.addedAt - b.addedAt),
      ),
    onError,
  )
}

export async function addMember(email: string) {
  if (!db) return
  await setDoc(doc(db, 'members', email.trim().toLowerCase()), {
    addedAt: Date.now(),
  })
}

export async function removeMember(email: string) {
  if (!db) return
  await deleteDoc(doc(db, 'members', email))
}
