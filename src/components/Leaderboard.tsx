import { CSSProperties, useEffect, useState } from 'react'
import { Mode, BLITZ_SECONDS } from '../game/state'
import { Entry, fetchTop, isGuestName } from '../game/leaderboard'
import { AppBar } from './PhoneFrame'
import { Wordmark } from './Logo'
import { Caret, Ghost, PacMan } from './arcade'

/** Blinky, Pinky, Inky, Clyde — cycled so anonymous rows stay distinct. */
const GHOST_COLORS = ['#ff5b4a', '#ff9ecb', '#4de6ff', '#ffb457']

const ordinal = (n: number) => {
  const tail = ['TH', 'ST', 'ND', 'RD']
  const v = n % 100
  return `${n}${tail[(v - 20) % 10] || tail[v] || tail[0]}`
}

/** Arcade scores are zero-padded, so the column stays a solid block. */
const padScore = (n: number) => String(n).padStart(3, '0')

export function LeaderboardScreen({
  initialMode,
  onBack,
}: {
  initialMode: Mode
  onBack: () => void
}) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setEntries(null)
    setFailed(false)
    fetchTop(mode)
      .then((e) => !cancelled && setEntries(e))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [mode])

  /** Arcade menu item: the chosen one gets a blinking caret. */
  const seg = (value: Mode, label: string) => (
    <button
      role="tab"
      aria-selected={mode === value}
      className={`seg state-layer ${mode === value ? 'active' : ''}`}
      onClick={() => setMode(value)}
    >
      <span className="seg-check"><Caret /></span>
      {label}
    </button>
  )

  const best = entries?.[0]?.score ?? 0

  return (
    <div className="app-shell arcade">
      <AppBar title={<Wordmark />} onBack={onBack} />
      <div className="screen board">
        <div className="arcade-top">
          <span className="blink">1UP</span>
          <span>
            HIGH SCORE <b>{padScore(best)}</b>
          </span>
        </div>

        <h2 className="board-title">
          <PacMan size={26} /> Top Dogs
        </h2>
        <div className="segmented" role="tablist" aria-label="Leaderboard mode">
          {seg('streak', 'Streak')}
          {seg('blitz', `${BLITZ_SECONDS}s Blitz`)}
        </div>

        {failed && (
          <div className="board-empty">
            <Ghost size={36} />
            <p className="tagline">We could not load the scores.</p>
          </div>
        )}
        {!failed && entries === null && (
          <ul className="board-list" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="board-row skeleton" />
            ))}
          </ul>
        )}
        {!failed && entries !== null && entries.length === 0 && (
          <div className="board-empty">
            <Ghost size={36} />
            <p className="tagline">No scores yet. Be the first!</p>
          </div>
        )}
        {!failed && entries !== null && entries.length > 0 && (
          <ul className="board-list">
            <li className="board-head" aria-hidden="true">
              <span className="board-rank">Rank</span>
              <span className="board-name">Name</span>
              <span className="board-dots" />
              <span className="board-score">Score</span>
            </li>
            {entries.map((e, i) => {
              const anon = isGuestName(e.name)
              return (
                <li
                  key={i}
                  className={`board-row ${i < 3 ? `podium-${i + 1}` : ''} ${anon ? 'anon' : ''}`}
                  style={{ '--i': i, '--ghost': GHOST_COLORS[i % 4] } as CSSProperties}
                >
                  <span className="board-rank">{ordinal(i + 1)}</span>
                  <span className="board-name">
                    {anon && (
                      <span className="ghost-mark">
                        <Ghost />
                      </span>
                    )}
                    {e.name}
                  </span>
                  <span className="board-dots" />
                  <span className="board-score">{padScore(e.score)}</span>
                </li>
              )
            })}
          </ul>
        )}

        <p className="arcade-foot blink">Play as a guest — no account needed</p>
      </div>
    </div>
  )
}
