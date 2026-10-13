import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'
// 'system' follows the device setting and is the default.
export type ThemePreference = Theme | 'system'

// Keep the key in sync with the inline script in index.html.
const STORAGE_KEY = 'margelle.theme'
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

function currentPreference(): ThemePreference {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

function currentTheme(): Theme {
  const preference = currentPreference()
  if (preference !== 'system') return preference
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

export function setThemePreference(preference: ThemePreference) {
  if (preference === 'system') localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, preference)
  apply()
}

// The theme actually shown.
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, currentTheme)
}

// What the person chose: light, dark, or follow the system.
export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, currentPreference)
}
