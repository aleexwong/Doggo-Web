import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BLITZ_SECONDS, GameState, initialState, reducer } from '../src/game/state'
import { Round } from '../src/game/rounds'

const breed = (path: string) => ({ path, name: path })
const round = (answer = 'pug'): Round => ({
  answer: breed(answer),
  choices: [breed(answer), breed('husky'), breed('beagle'), breed('boxer')],
  imageUrl: `https://images.dog.ceo/${answer}.jpg`,
})

/** A state as it would be mid-run, with overrides for the case under test. */
const at = (over: Partial<GameState> = {}): GameState => ({
  ...initialState(),
  phase: 'playing',
  round: round(),
  ...over,
})

test('starts on the boot screen and moves to home', () => {
  assert.equal(initialState().phase, 'boot')
  assert.equal(reducer(initialState(), { type: 'BOOTED' }).phase, 'home')
})

test('START clears the previous run and records the best to beat', () => {
  const before = at({ phase: 'home', score: 9, streak: 9, bestStreak: 12, bestBlitz: 30 })
  const s = reducer(before, { type: 'START', mode: 'streak' })
  assert.equal(s.phase, 'loading')
  assert.equal(s.mode, 'streak')
  assert.equal(s.score, 0)
  assert.equal(s.streak, 0)
  assert.equal(s.round, null)
  assert.equal(s.nextRound, null)
  assert.equal(s.deadline, null)
  assert.equal(s.timeLeft, BLITZ_SECONDS)
  // prevBest is the mode's own best, so game over can tell a new best from a tie.
  assert.equal(s.prevBest, 12)
  assert.equal(reducer(before, { type: 'START', mode: 'blitz' }).prevBest, 30)
})

test('the blitz clock only starts once the first round has loaded', () => {
  const loading = at({ phase: 'loading', mode: 'blitz', round: null })
  const before = Date.now()
  const s = reducer(loading, { type: 'FIRST_ROUND', round: round() })
  assert.equal(s.phase, 'playing')
  assert.notEqual(s.deadline, null)
  // Fetching the first round must not eat into the player's 60 seconds.
  assert.ok(s.deadline! >= before + BLITZ_SECONDS * 1000)
  assert.ok(s.deadline! <= Date.now() + BLITZ_SECONDS * 1000)
})

test('streak mode never sets a deadline', () => {
  const s = reducer(at({ phase: 'loading', mode: 'streak', round: null }), {
    type: 'FIRST_ROUND',
    round: round(),
  })
  assert.equal(s.deadline, null)
})

test('a round that arrives after the player quit is ignored', () => {
  // Round-building is async, so FIRST_ROUND can land after HOME or game over.
  for (const phase of ['home', 'gameover', 'playing', 'error'] as const) {
    const before = at({ phase, round: null })
    assert.equal(reducer(before, { type: 'FIRST_ROUND', round: round() }), before)
  }
  const over = at({ phase: 'gameover' })
  assert.equal(reducer(over, { type: 'NEXT_READY', round: round() }), over)
})

test('a correct answer scores, extends the streak, and reveals', () => {
  const s = reducer(at({ score: 3, streak: 3 }), { type: 'ANSWER', path: 'pug' })
  assert.equal(s.phase, 'reveal')
  assert.equal(s.picked, 'pug')
  assert.equal(s.score, 4)
  assert.equal(s.streak, 4)
  assert.equal(s.bestStreak, 4)
})

test('a wrong answer ends a streak run but not a blitz run', () => {
  const streak = reducer(at({ mode: 'streak', score: 3, streak: 3 }), { type: 'ANSWER', path: 'husky' })
  assert.equal(streak.phase, 'gameover')
  assert.equal(streak.score, 3)
  assert.equal(streak.streak, 0)

  const blitz = reducer(at({ mode: 'blitz', score: 3, streak: 3 }), { type: 'ANSWER', path: 'husky' })
  assert.equal(blitz.phase, 'reveal')
  assert.equal(blitz.score, 3)
  assert.equal(blitz.streak, 0)
})

test('the personal best only ever grows', () => {
  const s = reducer(at({ mode: 'streak', score: 1, streak: 1, bestStreak: 20 }), {
    type: 'ANSWER',
    path: 'pug',
  })
  assert.equal(s.bestStreak, 20)
})

test('answers outside the playing phase are ignored', () => {
  // Guards double-taps during the reveal pause and clicks after game over.
  for (const phase of ['reveal', 'gameover', 'loading', 'home'] as const) {
    const before = at({ phase })
    assert.equal(reducer(before, { type: 'ANSWER', path: 'pug' }), before)
  }
  const noRound = at({ round: null })
  assert.equal(reducer(noRound, { type: 'ANSWER', path: 'pug' }), noRound)
})

test('ADVANCE uses the prefetched round, or waits for one', () => {
  const next = round('husky')
  const withNext = reducer(at({ phase: 'reveal', picked: 'pug', nextRound: next }), { type: 'ADVANCE' })
  assert.equal(withNext.phase, 'playing')
  assert.equal(withNext.round, next)
  assert.equal(withNext.nextRound, null)
  assert.equal(withNext.picked, null)

  const without = reducer(at({ phase: 'reveal', picked: 'pug', nextRound: null }), { type: 'ADVANCE' })
  assert.equal(without.phase, 'loading')
  assert.equal(without.round, null)
  assert.equal(without.picked, null)
})

test('ADVANCE outside a reveal is ignored', () => {
  const before = at({ phase: 'playing' })
  assert.equal(reducer(before, { type: 'ADVANCE' }), before)
})

test('the clock is derived from the deadline, not counted down per tick', () => {
  // A backgrounded tab throttles timers; deriving from the deadline means a
  // slow or skipped tick can never hand out extra seconds.
  const s = reducer(at({ mode: 'blitz', deadline: Date.now() + 12_600 }), { type: 'TICK' })
  assert.equal(s.timeLeft, 13)
  assert.equal(s.phase, 'playing')
})

test('the blitz ends and banks the score when the deadline passes', () => {
  const s = reducer(at({ mode: 'blitz', score: 17, deadline: Date.now() - 1000, bestBlitz: 5 }), {
    type: 'TICK',
  })
  assert.equal(s.phase, 'gameover')
  assert.equal(s.timeLeft, 0)
  assert.equal(s.bestBlitz, 17)
})

test('ticks do nothing in streak mode or once the run is over', () => {
  const streak = at({ mode: 'streak', deadline: null })
  assert.equal(reducer(streak, { type: 'TICK' }), streak)
  const over = at({ mode: 'blitz', phase: 'gameover', deadline: Date.now() - 1000 })
  assert.equal(reducer(over, { type: 'TICK' }), over)
})

test('FAIL only applies while loading', () => {
  assert.equal(reducer(at({ phase: 'loading' }), { type: 'FAIL' }).phase, 'error')
  const playing = at({ phase: 'playing' })
  assert.equal(reducer(playing, { type: 'FAIL' }), playing)
})

test('HOME clears the run', () => {
  const s = reducer(at({ phase: 'gameover', score: 8, streak: 8, picked: 'pug' }), { type: 'HOME' })
  assert.equal(s.phase, 'home')
  assert.equal(s.score, 0)
  assert.equal(s.streak, 0)
  assert.equal(s.round, null)
  assert.equal(s.picked, null)
})
