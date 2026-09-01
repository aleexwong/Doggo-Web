import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'doggo.theme'
/** Matches --m3-surface in styles.css, so the browser chrome blends in. */
const SURFACE: Record<Theme, string> = { light: '#fcfcfc', dark: '#0f1011' }

// localStorage can throw (Safari private mode, storage disabled), so every
// access is guarded — a blocked store just means the choice doesn't persist.
function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * App theme, the way a current Android app does it: follow the system by
 * default, remember an explicit choice, and flip live when the system
 * changes underneath an undecided player.
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => stored() ?? systemTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', SURFACE[theme])
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const onChange = () => {
      if (!stored()) setTheme(systemTheme())
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(KEY, next)
      } catch {
        /* choice just won't persist */
      }
      return next
    })
  }, [])

  return [theme, toggle]
}
