import { useEffect, useRef, useState } from 'react'
import { GameState, Mode, BLITZ_SECONDS } from '../game/state'
import {
  leaderboardEnabled,
  loadNickname,
  saveNickname,
  submitScore,
  validName,
  nameIssue,
  guestName,
  NAME_MAX,
} from '../game/leaderboard'
import { Theme } from '../game/theme'
import { track } from '../game/track'
import { AppBar } from './PhoneFrame'
import { DogSketch, PawMark, Wordmark } from './Logo'
import { LeaderboardIcon, ThemeIcon } from './icons'

export function BootScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 1400)
    return () => clearTimeout(id)
  }, [onDone])
  return (
    <div className="screen boot" onClick={onDone}>
      <div className="boot-paw" aria-hidden="true">
        <PawMark size={72} />
      </div>
      <div className="boot-name">Doggo</div>
      <div className="boot-sub">by alex wong</div>
    </div>
  )
}

/** Theme switch, shown in the app bar the way a current Android app does. */
export function ThemeButton({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button
      className="appbar-icon state-layer"
      onClick={onToggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <ThemeIcon dark={theme === 'dark'} />
    </button>
  )
}

export function HomeScreen({
  bestStreak,
  bestBlitz,
  theme,
  onToggleTheme,
  onStart,
  onBoard,
}: {
  bestStreak: number
  bestBlitz: number
  theme: Theme
  onToggleTheme: () => void
  onStart: (mode: Mode) => void
  onBoard: () => void
}) {
  return (
    <div className="app-shell">
      <AppBar
        title={<Wordmark />}
        trailing={
          <>
            <ThemeButton theme={theme} onToggle={onToggleTheme} />
            {leaderboardEnabled && (
              <button
                className="appbar-icon state-layer"
                onClick={onBoard}
                aria-label="Leaderboard"
              >
                <LeaderboardIcon />
              </button>
            )}
          </>
        }
      />
      <div className="screen home">
        <div className="hero">
          <div className="hero-avatar" aria-hidden="true">
            <DogSketch size={50} />
          </div>
          <h1>Guess the breed!</h1>
          <p className="tagline">A photo appears — you have four choices.</p>
        </div>
        <div className="mode-list">
          <button className="mode-card streak state-layer" onClick={() => onStart('streak')}>
            <span className="mode-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.5 0.7s.8 2.9.8 5.2c0 2.2-1.5 4-3.7 4S6.9 8.1 6.9 5.9c0-.5 0-1 .1-1.4C4.7 6.9 3 10 3 13.2 3 18.1 7 22 12 22s9-3.9 9-8.8c0-6-4.3-10.7-7.5-12.5ZM12 19.5c-1.9 0-3.4-1.5-3.4-3.4 0-1.7 1.1-2.9 3-3.3 1.9-.4 3.9-1.3 5-2.9.4 1.3.7 2.7.7 4.1 0 3-2.4 5.5-5.3 5.5Z" />
              </svg>
            </span>
            <span className="mode-text">
              <span className="mode-name">Endless Streak</span>
              <span className="mode-desc">One mistake ends the game</span>
            </span>
            <span className="mode-best">{bestStreak > 0 ? `Best ${bestStreak}` : 'New'}</span>
          </button>
          <button className="mode-card blitz state-layer" onClick={() => onStart('blitz')}>
            <span className="mode-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 1H9v2h6V1Zm-4 13h2V8h-2v6Zm8.03-6.61 1.42-1.42-1.42-1.42-1.42 1.42A8.96 8.96 0 0 0 12 4a9 9 0 1 0 9 9c0-2.12-.74-4.07-1.97-5.61ZM12 20a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />
              </svg>
            </span>
            <span className="mode-text">
              <span className="mode-name">{BLITZ_SECONDS}s Blitz</span>
              <span className="mode-desc">Answer as many as you can</span>
            </span>
            <span className="mode-best">{bestBlitz > 0 ? `Best ${bestBlitz}` : 'New'}</span>
          </button>
        </div>
        <p className="home-footnote">Photos from Dog.CEO · no account needed</p>
        {/* Shown only in the frameless presentation — see .home-credits. */}
        <p className="home-credits">
          A web remake of the{' '}
          <a href="https://github.com/aleexwong/Doggo" target="_blank" rel="noreferrer">
            Doggo Android app
          </a>{' '}
          · photos by{' '}
          <a href="https://dog.ceo/dog-api/" target="_blank" rel="noreferrer">
            Dog.CEO
          </a>
        </p>
      </div>
    </div>
  )
}

export function LoadingScreen() {
  return (
    <div className="app-shell">
      <AppBar title={<Wordmark />} />
      <div className="screen loading" role="status" aria-label="Loading">
        <div className="m3-loader" aria-hidden="true">
          <span className="m3-loader-shape">
            <PawMark size={30} />
          </span>
        </div>
        <p className="tagline">Finding good dogs…</p>
      </div>
    </div>
  )
}

export function ErrorScreen({ onRetry, onHome }: { onRetry: () => void; onHome: () => void }) {
  return (
    <div className="app-shell">
      <AppBar title={<Wordmark />} onBack={onHome} />
      <div className="screen error">
        <div className="error-paw" aria-hidden="true">
          <PawMark size={56} />
        </div>
        <p className="error-title">The dogs are sleeping</p>
        <p className="tagline">We could not load the dog photos.</p>
        <button className="btn-filled state-layer" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  )
}

/** Every run earns a rank — the ladder is the reason to play again. */
function earnedTitle(mode: Mode, n: number): string {
  const ladder: [number, string][] =
    mode === 'streak'
      ? [
          [50, 'Legendary Dog Expert'],
          [25, 'Master of Breeds'],
          [15, 'Dog Show Judge'],
          [10, 'Dog Expert'],
          [5, 'Real Dog Lover'],
          [3, 'Dog Park Visitor'],
          [1, 'Puppy in Training'],
          [0, 'Just Getting Started'],
        ]
      : [
          [40, 'Lightning Fast'],
          [30, 'Super Speedy'],
          [20, 'Fetch Champion'],
          [12, 'Quick Thinker'],
          [6, 'Getting Faster'],
          [1, 'Slow Start'],
          [0, 'Just Getting Started'],
        ]
  return ladder.find(([min]) => n >= min)![1]
}

export function GameOverScreen({
  state,
  onPlayAgain,
  onHome,
  onBoard,
}: {
  state: GameState
  onPlayAgain: () => void
  onHome: () => void
  onBoard: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [nick, setNick] = useState(loadNickname)
  const [post, setPost] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  // Move focus to the primary action when the game ends, so keyboard players
  // can restart with Enter without hunting for the button.
  const playAgainRef = useRef<HTMLButtonElement>(null)
  const postScore = async (overrideName?: string) => {
    const name = overrideName ?? nick
    if (!validName(name) || post === 'saving') return
    setPost('saving')
    try {
      if (!overrideName) saveNickname(name)
      await submitScore(state.mode, name, state.score)
      setPost('done')
      // The handle itself never leaves the game — only whether it was a guest.
      track({
        event: 'score_posted',
        mode: state.mode,
        score: state.score,
        guest: overrideName !== undefined,
      })
    } catch {
      setPost('error')
    }
  }
  // One-tap guest posting for players who don't want to pick a name.
  const postAsGuest = () => postScore(guestName())
  const issue = nameIssue(nick)
  const isStreak = state.mode === 'streak'
  const missedBreed =
    state.round && state.picked && state.picked !== state.round.answer.path
      ? state.round.answer.name
      : null
  const result = state.score
  const best = isStreak ? state.bestStreak : state.bestBlitz
  const isNewBest = result > 0 && result > state.prevBest
  // Focus the primary action on game over so keyboard players can restart with
  // Enter — but not when the name field is showing, so it stays typeable.
  const showNameInput = leaderboardEnabled && result > 0 && post === 'idle'
  useEffect(() => {
    if (!showNameInput) playAgainRef.current?.focus()
    // Focus once on mount for this game-over screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const share = async () => {
    const feat = isStreak
      ? `${result} dog breeds in a row`
      : `${result} dog breeds in ${BLITZ_SECONDS} seconds`
    const text = `${earnedTitle(state.mode, result)} — I named ${feat} on Doggo. ${location.href}`
    try {
      if (navigator.share) {
        await navigator.share({ text })
      } else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }
      track({ event: 'score_shared', mode: state.mode, score: result })
    } catch {
      /* user cancelled or clipboard blocked */
    }
  }
  return (
    <div className="app-shell">
      <AppBar title={isStreak ? 'Streak over' : "Time's up"} onBack={onHome} />
      <div className="screen gameover">
        <div className="result-card">
          <div className="final-score">{result}</div>
          <p className="tagline">{isStreak ? 'breeds in a row' : 'breeds you got right'}</p>
          {missedBreed && (
            <p className="missed-line">
              The last one was a <strong>{missedBreed}</strong>
            </p>
          )}
          <p className="title-earned">{earnedTitle(state.mode, result)}</p>
          {isNewBest ? (
            <p className="best-line new-best">New personal best!</p>
          ) : (
            <p className="best-line">Personal best · {best}</p>
          )}
        </div>
        {leaderboardEnabled && result > 0 && post !== 'done' && (
          <div className="post-block">
            <div className="post-row">
              <input
                className="nick-input"
                placeholder="Your name"
                value={nick}
                maxLength={NAME_MAX}
                onChange={(e) => setNick(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && postScore()}
                aria-label="Name for the leaderboard"
              />
              <button
                className="btn-tonal state-layer"
                disabled={!validName(nick) || post === 'saving'}
                onClick={() => postScore()}
              >
                {post === 'saving' ? 'Posting…' : 'Post score'}
              </button>
            </div>
            {issue && nick.trim().length > 0 && <p className="post-hint">{issue}</p>}
            <button
              className="btn-text guest-link state-layer"
              onClick={postAsGuest}
              disabled={post === 'saving'}
            >
              Post without a name
            </button>
          </div>
        )}
        {post === 'error' && (
          <p className="post-note">We could not save your score. Please try again.</p>
        )}
        {post === 'done' && (
          <p className="post-note posted">
            Posted!{' '}
            <button className="btn-text inline state-layer" onClick={onBoard}>
              See the scores
            </button>
          </p>
        )}
        <button
          ref={playAgainRef}
          className="btn-filled play-again state-layer"
          onClick={onPlayAgain}
        >
          Play again
        </button>
        <div className="btn-group row">
          <button className="btn-tonal state-layer" onClick={share}>
            {copied ? 'Copied!' : 'Share'}
          </button>
          {leaderboardEnabled && (
            <button className="btn-tonal state-layer" onClick={onBoard}>
              Top Dogs
            </button>
          )}
          <button className="btn-tonal state-layer" onClick={onHome}>
            Home
          </button>
        </div>
      </div>
    </div>
  )
}
