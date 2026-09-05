import { useCallback, useEffect, useState } from 'react'
import { SURFACE, THEME_KEY as KEY, Theme } from './appearance'

// The storage key and the surface colours are shared with the pre-paint
// script in index.html, so they live in appearance.ts.
export type { Theme }

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
 * changes underneath an undecided player. `preferDark` lets a presentation
 * that needs a dark picture (the CRT) change the untouched default without
 * overriding a choice the player already made.
 */
export function useTheme(preferDark = false): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => stored() ?? (preferDark ? 'dark' : systemTheme()))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', SURFACE[theme])
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const onChange = () => {
      // A stored choice wins; so does a frame that asked for dark.
      if (!stored() && !preferDark) setTheme(systemTheme())
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preferDark])

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
