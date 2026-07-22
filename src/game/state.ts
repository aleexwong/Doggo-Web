import { Round } from './rounds'

export type Mode = 'streak' | 'blitz'
export const BLITZ_SECONDS = 60

export type Phase =
  | 'boot'
  | 'home'
  | 'loading' // fetching first round
  | 'playing' // waiting for an answer
  | 'reveal' // answer shown, about to advance
  | 'gameover'
  | 'error'

export interface GameState {
  phase: Phase
  mode: Mode
  round: Round | null
  nextRound: Round | null
  picked: string | null // breed path the player tapped
  score: number
  streak: number
  timeLeft: number
  bestStreak: number
  bestBlitz: number
  /** The mode's best when this run started, so game over can tell a
   *  genuinely new best apart from a tie with the old one. */
  prevBest: number
  /** Wall-clock epoch (ms) when the blitz run ends; null outside blitz.
   *  Deriving timeLeft from this keeps the clock accurate across tab
   *  throttling and reveal pauses instead of drifting per tick. */
  deadline: number | null
}

export type Action =
  | { type: 'BOOTED' }
  | { type: 'START'; mode: Mode }
  | { type: 'FIRST_ROUND'; round: Round }
  | { type: 'NEXT_READY'; round: Round }
  | { type: 'ANSWER'; path: string }
  | { type: 'ADVANCE' }
  | { type: 'TICK' }
  | { type: 'FAIL' }
  | { type: 'HOME' }

const BEST_STREAK_KEY = 'doggo.bestStreak'
const BEST_BLITZ_KEY = 'doggo.bestBlitz'

// localStorage can throw (Safari private mode, storage disabled/full), so
// every access is guarded — a blocked store just means bests don't persist,
// rather than crashing the game on the first answer.
function readNum(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0
  } catch {
    return 0
  }
}
function writeStr(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable — skip persistence */
  }
}

export function loadBests() {
  return {
    bestStreak: readNum(BEST_STREAK_KEY),
    bestBlitz: readNum(BEST_BLITZ_KEY),
  }
}

function saveBests(s: GameState) {
  writeStr(BEST_STREAK_KEY, String(s.bestStreak))
  writeStr(BEST_BLITZ_KEY, String(s.bestBlitz))
}

export function initialState(): GameState {
  return {
    phase: 'boot',
    mode: 'streak',
    round: null,
    nextRound: null,
    picked: null,
    score: 0,
    streak: 0,
    timeLeft: BLITZ_SECONDS,
    prevBest: 0,
    deadline: null,
    ...loadBests(),
  }
}

export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'BOOTED':
      return { ...s, phase: 'home' }
    case 'START':
      return {
        ...s,
        phase: 'loading',
        mode: a.mode,
        round: null,
        nextRound: null,
        picked: null,
        score: 0,
        streak: 0,
        timeLeft: BLITZ_SECONDS,
        prevBest: a.mode === 'streak' ? s.bestStreak : s.bestBlitz,
        deadline: null,
      }
    // Round-building is async, so these can arrive after the player has
    // quit or the game ended — only accept them in phases that expect them.
    case 'FIRST_ROUND':
      if (s.phase !== 'loading') return s
      // Start the blitz clock only now — time spent fetching the first round
      // shouldn't count against the player.
      return {
        ...s,
        phase: 'playing',
        round: a.round,
        deadline: s.mode === 'blitz' ? Date.now() + BLITZ_SECONDS * 1000 : null,
      }
    case 'NEXT_READY':
      if (s.phase !== 'loading' && s.phase !== 'playing' && s.phase !== 'reveal') return s
      return { ...s, nextRound: a.round }
    case 'ANSWER': {
      if (s.phase !== 'playing' || !s.round) return s
      const correct = a.path === s.round.answer.path
      const next: GameState = {
        ...s,
        phase: 'reveal',
        picked: a.path,
        score: correct ? s.score + 1 : s.score,
        streak: correct ? s.streak + 1 : 0,
      }
      if (s.mode === 'streak') next.bestStreak = Math.max(next.bestStreak, next.streak)
      if (!correct && s.mode === 'streak') {
        next.phase = 'gameover'
      }
      saveBests(next)
      return next
    }
    case 'ADVANCE': {
      if (s.phase !== 'reveal') return s
      if (!s.nextRound) return { ...s, phase: 'loading', round: null, picked: null }
      return { ...s, phase: 'playing', round: s.nextRound, nextRound: null, picked: null }
    }
    case 'TICK': {
      if (s.mode !== 'blitz' || s.deadline == null) return s
      if (s.phase !== 'playing' && s.phase !== 'reveal') return s
      // Derive remaining time from the deadline, so a throttled/background
      // tab or an uneven tick interval can't hand out extra seconds.
      const timeLeft = Math.max(0, Math.ceil((s.deadline - Date.now()) / 1000))
      if (timeLeft <= 0) {
        const next = { ...s, timeLeft: 0, phase: 'gameover' as Phase }
        next.bestBlitz = Math.max(next.bestBlitz, next.score)
        saveBests(next)
        return next
      }
      return { ...s, timeLeft }
    }
    case 'FAIL':
      if (s.phase !== 'loading') return s
      return { ...s, phase: 'error' }
    case 'HOME':
      return { ...initialState(), phase: 'home' }
  }
}
