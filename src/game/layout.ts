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

/** The one switch. The pre-paint script in index.html is generated from this
 *  at build time (see src/game/appearance.ts), so it follows automatically. */
export const DEFAULT_FRAME: Frame = 'arcade'

/** Every accepted `?frame=` value, and the frame it means. */
export const FRAME_ALIASES: Record<string, Frame> = {
  web: 'web',
  none: 'web',
  bare: 'web',
  arcade: 'arcade',
  crt: 'arcade',
  phone: 'phone',
  device: 'phone',
}

export function initialFrame(): Frame {
  try {
    const asked = new URLSearchParams(location.search).get('frame')?.toLowerCase()
    // Compared by value rather than `in`, so a query like ?frame=constructor
    // can't reach Object.prototype and come back as something truthy.
    const frame = asked ? FRAME_ALIASES[asked] : undefined
    if (frame === 'web' || frame === 'arcade' || frame === 'phone') return frame
  } catch {
    /* no location (SSR, tests) — fall through to the default */
  }
  return DEFAULT_FRAME
}

/** A CRT wants a dark picture, so that frame changes the untouched default. */
export function framePrefersDark(frame: Frame): boolean {
  return frame === 'arcade'
}
