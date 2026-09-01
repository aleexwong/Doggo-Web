/**
 * The app ships in three presentations from one build:
 *
 *   phone  — the screens inside a drawn Android device, for embedding on a
 *            page that wants a product shot you can actually play
 *   web    — the same screens filling the browser, laid out responsively
 *   arcade — the screens behind the bulging glass of a CRT arcade monitor
 *
 * Pick one with `?frame=web`, `?frame=arcade` or `?frame=phone`. To change
 * which you get without a query string, edit DEFAULT_FRAME.
 */
export type Frame = 'phone' | 'web' | 'arcade'

export const DEFAULT_FRAME: Frame = 'phone'

export function initialFrame(): Frame {
  try {
    const asked = new URLSearchParams(location.search).get('frame')?.toLowerCase()
    if (asked === 'web' || asked === 'none' || asked === 'bare') return 'web'
    if (asked === 'arcade' || asked === 'crt') return 'arcade'
    if (asked === 'phone' || asked === 'device') return 'phone'
  } catch {
    /* no location (SSR, tests) — fall through to the default */
  }
  return DEFAULT_FRAME
}

/** A CRT wants a dark picture, so that frame changes the untouched default. */
export function framePrefersDark(frame: Frame): boolean {
  return frame === 'arcade'
}
