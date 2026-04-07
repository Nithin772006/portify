import { useEffect, useState } from 'react'

type ThemeMode = 'dark' | 'light'

const THEME_STORAGE_KEY = 'portify-theme'

function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' ? 'light' : 'dark'
}

export function initializeTheme() {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = readStoredTheme()
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(readStoredTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}
