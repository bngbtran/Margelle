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
import type { Member, Profile, Role, Viewer } from './types'

const ROLE_KEY = 'margelle.role.'

// The library's owner: the only account that can invite people. Keep this in
// sync with isOwner() in firestore.rules.
export const OWNER_EMAIL = 'tranbnb.2004@gmail.com'

function isOwnerEmail(email: string | null) {
  return email?.toLowerCase() === OWNER_EMAIL
}

// The owner is fixed; everyone else needs an invitation (a document in
// `members` keyed by their e-mail address).
export async function resolveRole(user: User): Promise<Role | null> {
  if (!db) return 'owner'
  if (isOwnerEmail(user.email) && user.emailVerified) return 'owner'
  if (!user.email) return null
  try {
    const member = await getDoc(doc(db, 'members', user.email.toLowerCase()))
    const role = member.exists() ? 'member' : null
    if (role) localStorage.setItem(ROLE_KEY + user.uid, role)
    else localStorage.removeItem(ROLE_KEY + user.uid)
    return role
  } catch (error) {
    // Offline: fall back to what this account was the last time we checked.
    if (localStorage.getItem(ROLE_KEY + user.uid) === 'member') return 'member'
    throw error
  }
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

// Recorded on every visit so the owner can see who uses the shelf. Shares the
// person's preferences document (users/{uid}).
export async function recordProfile(viewer: Viewer) {
  if (!db) return
  await setDoc(
    doc(db, 'users', viewer.uid),
    {
      name: viewer.name,
      email: viewer.email?.toLowerCase() ?? null,
      photoURL: viewer.photoURL,
      lastSeenAt: Date.now(),
    },
    { merge: true },
  )
}

// Owner only: everyone who has opened the shelf.
export function subscribeProfiles(
  onData: (profiles: Profile[]) => void,
  onError: (error: Error) => void,
) {
  if (!db) return () => {}
  return onSnapshot(
    collection(db, 'users'),
    (snapshot) =>
      onData(
        snapshot.docs.map((d) => {
          const data = d.data()
          return {
            uid: d.id,
            name: String(data.name ?? ''),
            email: typeof data.email === 'string' ? data.email : null,
            photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
            lastSeenAt: Number(data.lastSeenAt ?? 0),
          }
        }),
      ),
    onError,
  )
}

// Owner only: takes away someone's access. Their Google account itself is
// untouched, and what they contributed stays on the shelf.
export async function removeUser(email: string, uid: string | null) {
  if (!db) return
  await deleteDoc(doc(db, 'members', email))
  if (uid) await deleteDoc(doc(db, 'users', uid))
}
