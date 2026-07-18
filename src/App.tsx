import { useCallback, useEffect, useReducer, useState } from 'react'
import { LeaderboardScreen } from './components/Leaderboard'
import { PhoneFrame } from './components/PhoneFrame'
import { GameScreen } from './components/GameScreen'
import {
  BootScreen,
  HomeScreen,
  LoadingScreen,
  ErrorScreen,
  GameOverScreen,
} from './components/screens'
import { initialState, reducer, Mode } from './game/state'
import { Breed, fetchBreeds } from './game/api'
import { buildRound } from './game/rounds'

const REVEAL_MS = 1200

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [breeds, setBreeds] = useState<Breed[] | null>(null)
  const [showBoard, setShowBoard] = useState(false)

  useEffect(() => {
    fetchBreeds().then(setBreeds)
  }, [])

  const start = useCallback((mode: Mode) => dispatch({ type: 'START', mode }), [])

  // Fill the current round whenever we're loading: fresh start, breeds
  // arriving after start, or advancing past a round that wasn't prefetched.
  // The reducer ignores these dispatches if the player quit meanwhile.
  useEffect(() => {
    if (state.phase !== 'loading' || state.round || !breeds) return
    buildRound(breeds)
      .then((round) => {
        dispatch({ type: 'FIRST_ROUND', round })
        // Prefetch the following round immediately.
        return buildRound(breeds)
      })
      .then((round) => dispatch({ type: 'NEXT_READY', round }))
      .catch(() => dispatch({ type: 'FAIL' }))
  }, [state.phase, state.round, breeds])

  // After an answer reveal, advance and prefetch the next-next round.
  useEffect(() => {
    if (state.phase !== 'reveal') return
    const id = setTimeout(() => {
      dispatch({ type: 'ADVANCE' })
      if (breeds) {
        buildRound(breeds)
          .then((round) => dispatch({ type: 'NEXT_READY', round }))
          .catch(() => {
            /* next ADVANCE falls back to loading state and retries */
          })
      }
    }, REVEAL_MS)
    return () => clearTimeout(id)
  }, [state.phase, state.round, breeds])

  // Blitz countdown.
  useEffect(() => {
    if (state.mode !== 'blitz' || (state.phase !== 'playing' && state.phase !== 'reveal')) return
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => clearInterval(id)
  }, [state.mode, state.phase])

  const onAnswer = useCallback((path: string) => dispatch({ type: 'ANSWER', path }), [])

  return (
    <div className="page">
      <PhoneFrame dark={state.phase === 'boot'}>
        {showBoard ? (
          <LeaderboardScreen initialMode={state.mode} onBack={() => setShowBoard(false)} />
        ) : (
          <>
            {state.phase === 'boot' && <BootScreen onDone={() => dispatch({ type: 'BOOTED' })} />}
            {state.phase === 'home' && (
              <HomeScreen
                bestStreak={state.bestStreak}
                bestBlitz={state.bestBlitz}
                onStart={start}
                onBoard={() => setShowBoard(true)}
              />
            )}
            {state.phase === 'loading' && <LoadingScreen />}
            {(state.phase === 'playing' || state.phase === 'reveal') && (
              <GameScreen state={state} onAnswer={onAnswer} onQuit={() => dispatch({ type: 'HOME' })} />
            )}
            {state.phase === 'gameover' && (
              <GameOverScreen
                state={state}
                onPlayAgain={() => start(state.mode)}
                onHome={() => dispatch({ type: 'HOME' })}
                onBoard={() => setShowBoard(true)}
              />
            )}
            {state.phase === 'error' && (
              <ErrorScreen onRetry={() => start(state.mode)} onHome={() => dispatch({ type: 'HOME' })} />
            )}
          </>
        )}
      </PhoneFrame>
      <p className="footer">
        A web remake of the{' '}
        <a href="https://github.com/aleexwong/Doggo" target="_blank" rel="noreferrer">
          Doggo Android app
        </a>{' '}
        · photos by <a href="https://dog.ceo/dog-api/" target="_blank" rel="noreferrer">Dog.CEO</a>
      </p>
    </div>
  )
}
