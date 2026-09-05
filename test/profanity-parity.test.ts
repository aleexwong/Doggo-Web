import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { isClean } from '../src/game/profanity'

// The Cloud Function is CommonJS and has no types of its own, so require it.
const require_ = createRequire(import.meta.url)
const server = require_('../functions/profanity.js') as { isClean: (name: string) => boolean }
const words = require_('../functions/profanity-words.json') as {
  blocked: string[]
  leet: Record<string, string>
}

/**
 * The client filter is a UX gate; the Cloud Function is the enforced one.
 * They now read the same word list, but each keeps its own copy of the few
 * lines of matching code — so this is what stops the two drifting apart. A
 * name the player is allowed to type must not be one the server then refuses,
 * and a name the client refuses must not be one the server would have taken.
 */
const agree = (name: string) =>
  assert.equal(isClean(name), server.isClean(name), `filters disagreed on "${name}"`)

test('client and server agree on ordinary and obviously bad names', () => {
  const cases = [
    'Alex',
    'Doggo Fan',
    'Guest-4211',
    'Scunthorpe',
    '',
    '!!!',
    '1234',
    'shit',
    'SHIT',
    'ShItLord',
    'sh1t',
    'f4g',
    '$hit',
    'b1tch',
    'f.u.c.k',
    'f u c k',
    'fuuuuck',
    'sshhiitt',
  ]
  cases.forEach(agree)
})

test('client and server agree on every word in the shared list', () => {
  // Covers the whole list rather than a sample, in the shapes a player would
  // actually type it: plain, shouted, leetened, and buried in a longer name.
  const leetify = (w: string) =>
    w
      .split('')
      .map((c) => Object.keys(words.leet).find((k) => words.leet[k] === c) ?? c)
      .join('')

  for (const word of words.blocked) {
    ;[word, word.toUpperCase(), leetify(word), `xx${word}xx`].forEach(agree)
  }
})

test('the server tolerates values the client type system rules out', () => {
  // req.body is whatever was posted, so the function must not throw on it.
  for (const value of [null, undefined, 42, {}, []]) {
    assert.equal(server.isClean(value as never), true)
  }
})
