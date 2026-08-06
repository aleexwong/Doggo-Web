import { Mode } from './state'
import { timeoutSignal } from './api'
import { isClean } from './profanity'

// Firebase web client config, injected at build time (see .env.example).
// The values are public client identifiers — access control lives in
// Firestore security rules — but they're kept out of source on principle.
// When unset, the leaderboard UI hides itself and the game works fully
// offline-first with localStorage bests.
const PROJECT_ID = import.meta.env.VITE_FB_PROJECT_ID as string | undefined
const API_KEY = import.meta.env.VITE_FB_API_KEY as string | undefined

export const leaderboardEnabled = Boolean(PROJECT_ID && API_KEY)

const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const TIMEOUT_MS = 8000

// One collection per mode: keeps queries on a single auto-indexed field
// (score), so no composite index is required.
const collection = (mode: Mode) => `web_leaderboard_${mode}`

export interface Entry {
  name: string
  score: number
}

export const NAME_MIN = 2
export const NAME_MAX = 16

/** Why a name can't be posted, as a short user-facing reason — or null if OK. */
export function nameIssue(name: string): string | null {
  const n = name.trim()
  if (n.length < NAME_MIN) return `At least ${NAME_MIN} characters`
  if (n.length > NAME_MAX) return `At most ${NAME_MAX} characters`
  if (!isClean(n)) return 'Please pick a friendlier name'
  return null
}

export function validName(name: string): boolean {
  return nameIssue(name) === null
}

// Stable per-device guest handle, so a player who doesn't want to pick a name
// can still appear on the board (and keep the same identity across posts).
const GUEST_KEY = 'doggo.guestName'
export function guestName(): string {
  try {
    const existing = localStorage.getItem(GUEST_KEY)
    if (existing) return existing
  } catch {
    /* storage unavailable — fall through to a fresh, unpersisted handle */
  }
  const name = `Guest-${Math.floor(1000 + Math.random() * 9000)}`
  try {
    localStorage.setItem(GUEST_KEY, name)
  } catch {
    /* not persisted, but still usable for this post */
  }
  return name
}

// Keep in sync with firestore.rules, which rejects scores outside [1, 10000].
export const SCORE_MAX = 10000

/** Strip control chars, collapse whitespace, and clamp length before posting. */
export function sanitizeName(name: string): string {
  return name
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX)
}

export async function submitScore(mode: Mode, name: string, score: number): Promise<void> {
  const safeScore = Math.min(SCORE_MAX, Math.max(1, Math.round(score)))
  const res = await fetch(`${BASE}/${collection(mode)}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: timeoutSignal(TIMEOUT_MS),
    body: JSON.stringify({
      fields: {
        name: { stringValue: sanitizeName(name) },
        score: { integerValue: String(safeScore) },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    }),
  })
  if (!res.ok) throw new Error(`submit failed: HTTP ${res.status}`)
}

export async function fetchTop(mode: Mode, limit = 10): Promise<Entry[]> {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: timeoutSignal(TIMEOUT_MS),
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collection(mode) }],
          orderBy: [{ field: { fieldPath: 'score' }, direction: 'DESCENDING' }],
          // Over-fetch so we can collapse repeat names and still fill the board.
          limit: limit * 4,
        },
      }),
    },
  )
  if (!res.ok) throw new Error(`query failed: HTTP ${res.status}`)
  const rows: { document?: { fields?: Record<string, { stringValue?: string; integerValue?: string }> } }[] =
    await res.json()
  const all = rows
    .filter((r) => r.document?.fields)
    .map((r) => ({
      name: r.document!.fields!.name?.stringValue ?? 'anon',
      score: Number(r.document!.fields!.score?.integerValue ?? 0),
    }))
  // One row per name (rows are score-desc, so the first seen is that name's
  // best), so a single player can't occupy the whole board.
  const seen = new Set<string>()
  const top: Entry[] = []
  for (const e of all) {
    const key = e.name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    top.push(e)
    if (top.length >= limit) break
  }
  return top
}

const NICK_KEY = 'doggo.nickname'
export const loadNickname = () => {
  try {
    return localStorage.getItem(NICK_KEY) ?? ''
  } catch {
    return ''
  }
}
export const saveNickname = (n: string) => {
  try {
    localStorage.setItem(NICK_KEY, n.trim())
  } catch {
    /* storage unavailable — skip persistence */
  }
}
