/**
 * The app ships in two presentations from one build:
 *
 *   phone — the screens inside a drawn Android device, for embedding on a
 *           page that wants a product shot you can actually play
 *   web   — the same screens filling the browser, laid out responsively
 *
 * Pick one with `?frame=web` or `?frame=phone`. To change which you get
 * without a query string, edit DEFAULT_FRAME.
 */
export type Frame = 'phone' | 'web'

export const DEFAULT_FRAME: Frame = 'phone'

export function initialFrame(): Frame {
  try {
    const asked = new URLSearchParams(location.search).get('frame')?.toLowerCase()
    if (asked === 'web' || asked === 'none' || asked === 'bare') return 'web'
    if (asked === 'phone' || asked === 'device') return 'phone'
  } catch {
    /* no location (SSR, tests) — fall through to the default */
  }
  return DEFAULT_FRAME
}
