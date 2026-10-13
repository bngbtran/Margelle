import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

// Keep the key in sync with the inline script in index.html.
const STORAGE_KEY = 'margelle.theme'
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

function currentTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return systemDark.matches ? 'dark' : 'light'
}

function apply() {
  document.documentElement.classList.toggle('dark', currentTheme() === 'dark')
  for (const listener of listeners) listener()
}

systemDark.addEventListener('change', apply)
apply()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme)
  apply()
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, currentTheme)
}
