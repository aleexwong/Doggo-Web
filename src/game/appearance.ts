/**
 * Appearance constants that two places need: the React app, and the tiny
 * script in index.html that has to pick a theme *before first paint* so the
 * app never flashes the wrong one.
 *
 * That script runs before any module loads, so it cannot import — it used to
 * repeat these values as literals, with a comment asking the next person to
 * keep them in step. Instead, the Vite plugin in vite.config.ts imports
 * `appearanceConfig()` from here and injects it into the HTML at build time,
 * so there is one definition and nothing to keep in step.
 *
 * Deliberately free of React and of browser APIs at module scope, because the
 * Vite config imports it in Node.
 */
import { DEFAULT_FRAME, FRAME_ALIASES, Frame, framePrefersDark } from './layout'

export type Theme = 'light' | 'dark'

/** Where an explicit theme choice is remembered. */
export const THEME_KEY = 'doggo.theme'

/** Matches --m3-surface in styles.css, so the browser chrome blends in.
 *  public/manifest.webmanifest is a static file and keeps its own copy of
 *  the dark value for the install splash. */
export const SURFACE: Record<Theme, string> = { light: '#fcfcfc', dark: '#0f1011' }

/** The theme a frame wants when the player has not chosen one. */
export const defaultThemeFor = (frame: Frame): Theme => (framePrefersDark(frame) ? 'dark' : 'light')

/** Everything the pre-paint script needs, as plain JSON-able data. */
export function appearanceConfig() {
  return {
    key: THEME_KEY,
    surface: SURFACE,
    /** `?frame=` values that want a dark picture — the CRT and its aliases. */
    darkFrames: Object.keys(FRAME_ALIASES).filter((alias) =>
      framePrefersDark(FRAME_ALIASES[alias]),
    ),
    /** What no `?frame=` at all means, i.e. DEFAULT_FRAME. */
    defaultDark: framePrefersDark(DEFAULT_FRAME),
  }
}
