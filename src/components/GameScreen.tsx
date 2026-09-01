import { CSSProperties, useEffect, useState } from 'react'
import { GameState, BLITZ_SECONDS } from '../game/state'
import { fetchRandomImage } from '../game/api'
import { AppBar } from './PhoneFrame'
import { FlameSketch, PawMark, Wordmark } from './Logo'
import { CheckIcon, CloseIcon } from './icons'

/** Streak celebrations, also used to fill the progress bar in streak mode. */
const MILESTONES = [5, 10, 25, 50]

/** How far along the player is toward the next milestone, as a 0-1 fraction. */
function milestoneProgress(streak: number): { pct: number; next: number } {
  const next = MILESTONES.find((m) => m > streak) ?? (Math.floor(streak / 25) + 1) * 25
  const prev = [0, ...MILESTONES].filter((m) => m <= streak).pop() ?? 0
  return { pct: (streak - prev) / (next - prev), next }
}

export function GameScreen({
  state,
  onAnswer,
  onQuit,
}: {
  state: GameState
  onAnswer: (path: string) => void
  onQuit: () => void
}) {
  const { round, picked, phase } = state
  const revealing = phase === 'reveal' || phase === 'gameover'

  // Dog.CEO occasionally serves a broken or very slow image URL. The round
  // was preloaded, but the visible <img> is a separate request that can still
  // fail — so on error, swap in a fresh photo of the same breed a few times
  // rather than leave the card blank.
  const [imgSrc, setImgSrc] = useState(round?.imageUrl)
  const [imgTries, setImgTries] = useState(0)
  const [imgLoaded, setImgLoaded] = useState(false)
  useEffect(() => {
    setImgSrc(round?.imageUrl)
    setImgTries(0)
    setImgLoaded(false)
  }, [round?.imageUrl])
  const onImgError = () => {
    if (!round || imgTries >= 3) return
    setImgTries((n) => n + 1)
    fetchRandomImage(round.answer)
      .then(setImgSrc)
      .catch(() => {
        /* leave the shimmer placeholder; next round will recover */
      })
  }
  const milestone =
    phase === 'reveal' &&
    picked === round?.answer.path &&
    MILESTONES.includes(state.streak)

  // Keyboard play: 1-4 selects an answer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'playing' || !round) return
      const i = Number(e.key) - 1
      if (i >= 0 && i < round.choices.length) onAnswer(round.choices[i].path)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, round, onAnswer])

  if (!round) return null

  const isBlitz = state.mode === 'blitz'
  const urgent = isBlitz && state.timeLeft <= 10
  // Blitz counts the clock down; streak fills toward the next celebration.
  const progress = isBlitz
    ? state.timeLeft / BLITZ_SECONDS
    : milestoneProgress(state.streak).pct
  const nextMilestone = milestoneProgress(state.streak).next

  const hudRight = isBlitz ? (
    <span className={`chip timer-chip ${urgent ? 'urgent' : ''}`}>{state.timeLeft}s</span>
  ) : (
    <span className="chip">Best {state.bestStreak}</span>
  )

  return (
    <div className="app-shell">
      <AppBar title={<Wordmark size={20} />} onBack={onQuit} trailing={hudRight} />
      {/* M3 Expressive wavy progress: the spent part flattens out. */}
      <div className="progress-strip">
        <div
          className={`wave ${urgent ? 'urgent' : ''}`}
          style={{ '--pct': `${Math.max(0, Math.min(1, progress)) * 100}%` } as CSSProperties}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label={isBlitz ? 'Time remaining' : `Progress to a streak of ${nextMilestone}`}
        >
          <span className="wave-rest" />
          <span className="wave-fill" />
        </div>
      </div>
      <div className="screen game">
        <div className="hud">
          <span className="chip score-chip">
            {state.mode === 'streak' ? (
              <><FlameSketch size={15} /> Streak {state.streak}</>
            ) : (
              <><PawMark size={14} /> Score {state.score}</>
            )}
          </span>
          <span className="question">What breed is this?</span>
        </div>
        <div className={`dog-card ${imgLoaded ? 'loaded' : ''}`}>
          <img
            src={imgSrc}
            onError={onImgError}
            onLoad={() => setImgLoaded(true)}
            alt="A dog photo — guess the breed!"
          />
          {milestone && (
            <div className="paw-burst" aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => (
                <span key={i} className="burst-paw">
                  <PawMark size={22} />
                </span>
              ))}
              <span className="burst-label">{state.streak} streak!</span>
            </div>
          )}
        </div>
        <div className="answers" role="group" aria-label="Breed choices">
          {round.choices.map((b, i) => {
            const isAnswer = b.path === round.answer.path
            const isPicked = b.path === picked
            let cls = 'answer state-layer'
            if (revealing) {
              if (isAnswer) cls += ' correct'
              else if (isPicked) cls += ' wrong'
              else cls += ' dim'
            }
            return (
              <button
                key={b.path}
                className={cls}
                style={{ '--i': i } as CSSProperties}
                disabled={revealing}
                onClick={() => onAnswer(b.path)}
              >
                {revealing && isAnswer && (
                  <span className="answer-mark" aria-hidden="true"><CheckIcon size={17} /></span>
                )}
                {revealing && isPicked && !isAnswer && (
                  <span className="answer-mark" aria-hidden="true"><CloseIcon size={17} /></span>
                )}
                {b.name}
              </button>
            )
          })}
        </div>
        <div aria-live="polite" className="sr-only">
          {revealing && picked
            ? picked === round.answer.path
              ? `Correct! It's a ${round.answer.name}.`
              : `Wrong — it was a ${round.answer.name}.`
            : ''}
        </div>
      </div>
    </div>
  )
}
