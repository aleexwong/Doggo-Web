import { CSSProperties, useEffect, useState } from 'react'
import { Mode, BLITZ_SECONDS } from '../game/state'
import { Entry, fetchTop } from '../game/leaderboard'
import { Theme } from '../game/theme'
import { AppBar } from './PhoneFrame'
import { ThemeButton } from './screens'
import { PawMark, TrophySketch, Wordmark } from './Logo'
import { CheckIcon } from './icons'

export function LeaderboardScreen({
  initialMode,
  theme,
  onToggleTheme,
  onBack,
}: {
  initialMode: Mode
  theme: Theme
  onToggleTheme: () => void
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

  /** M3 segmented button: the selected segment grows a check mark. */
  const seg = (value: Mode, label: string) => (
    <button
      role="tab"
      aria-selected={mode === value}
      className={`seg state-layer ${mode === value ? 'active' : ''}`}
      onClick={() => setMode(value)}
    >
      <span className="seg-check" aria-hidden="true"><CheckIcon size={16} /></span>
      {label}
    </button>
  )

  return (
    <div className="app-shell">
      <AppBar
        title={<Wordmark />}
        onBack={onBack}
        trailing={<ThemeButton theme={theme} onToggle={onToggleTheme} />}
      />
      <div className="screen board">
        <h2 className="board-title">Top Dogs <TrophySketch size={24} /></h2>
        <div className="segmented" role="tablist" aria-label="Leaderboard mode">
          {seg('streak', 'Streak')}
          {seg('blitz', `${BLITZ_SECONDS}s Blitz`)}
        </div>

        {failed && (
          <div className="board-empty">
            <PawMark size={40} />
            <p className="tagline">Couldn't fetch the leaderboard right now.</p>
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
            <PawMark size={40} />
            <p className="tagline">No scores yet — be the first Top Dog!</p>
          </div>
        )}
        {!failed && entries !== null && entries.length > 0 && (
          <ul className="board-list">
            {entries.map((e, i) => (
              <li
                key={i}
                className={`board-row ${i < 3 ? `podium-${i + 1}` : ''}`}
                style={{ '--i': i } as CSSProperties}
              >
                <span className="board-rank">{i === 0 ? <TrophySketch size={18} /> : i + 1}</span>
                <span className="board-name">{e.name}</span>
                <span className="board-score">{e.score}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
