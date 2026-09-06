import { Mode } from './state'

/**
 * Anonymous play events, posted to the page that embeds the game.
 *
 * The game runs in an iframe on a host site, and nothing the host's analytics
 * does can see inside it — separate document, separate origin. So the game
 * posts these to `window.parent` instead, and the host forwards them wherever
 * it already sends events. No third-party script ships in here, and the host
 * decides what is worth recording.
 *
 * Nothing identifying is ever sent: no player name, no leaderboard handle, no
 * ids. The README has the listener side, which must check `event.origin` —
 * any page can post to any window, so an unchecked listener trusts anyone.
 */
export type TrackEvent =
  | { event: 'app_ready' }
  | { event: 'game_start'; mode: Mode }
  | { event: 'game_over'; mode: Mode; score: number; personalBest: boolean }
  | { event: 'score_posted'; mode: Mode; score: number; guest: boolean }
  | { event: 'leaderboard_open' }
  | { event: 'score_shared'; mode: Mode; score: number }

/** Marks our messages so a host listener can ignore everything else. */
export const TRACK_SOURCE = 'doggo'

/**
 * Who may receive the events. '*' reaches whoever embedded the game, which is
 * harmless for anonymous counters — set VITE_TRACK_ORIGIN to your site's
 * origin to narrow it anyway.
 */
const TARGET_ORIGIN = (import.meta.env.VITE_TRACK_ORIGIN as string | undefined) || '*'

export function track(payload: TrackEvent) {
  // Not embedded: there is no host to tell, and posting to ourselves is noise.
  if (typeof window === 'undefined' || window.parent === window) return
  try {
    window.parent.postMessage({ source: TRACK_SOURCE, ...payload }, TARGET_ORIGIN)
  } catch {
    /* a sandbox blocked it — telemetry must never break the game */
  }
}
