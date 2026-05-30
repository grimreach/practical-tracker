'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { THEME_STORAGE_KEY, getInitialTheme, getNextTheme } from '@/lib/theme.mjs'

type TrackerTheme = 'dark' | 'light'

function applyTheme(theme: TrackerTheme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<TrackerTheme>(() => {
    if (typeof window === 'undefined') return 'dark'
    return getInitialTheme(window.localStorage.getItem(THEME_STORAGE_KEY)) as TrackerTheme
  })
  const isLight = theme === 'light'

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function toggleTheme() {
    const nextTheme = getNextTheme(theme) as TrackerTheme
    setTheme(nextTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </span>
      <span>{isLight ? 'Light' : 'Dark'}</span>
    </button>
  )
}
