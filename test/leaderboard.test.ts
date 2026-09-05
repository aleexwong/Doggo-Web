import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  NAME_MAX,
  NAME_MIN,
  isGuestName,
  nameIssue,
  sanitizeName,
  validName,
} from '../src/game/leaderboard'

/** NUL, unit separator and DEL — the kind of thing a paste can smuggle in. */
const CTRL = String.fromCharCode(0, 31, 127)

test('nameIssue explains, in one short line, why a name is refused', () => {
  assert.equal(nameIssue(''), `At least ${NAME_MIN} characters`)
  assert.equal(nameIssue('a'), `At least ${NAME_MIN} characters`)
  // Length is measured after trimming, so spaces cannot pad a name to size.
  assert.equal(nameIssue('  a  '), `At least ${NAME_MIN} characters`)
  assert.equal(nameIssue('a'.repeat(NAME_MAX + 1)), `At most ${NAME_MAX} characters`)
  assert.equal(nameIssue('sh1thead'), 'Please choose a different name')
  assert.equal(nameIssue('Alex'), null)
  assert.equal(nameIssue('a'.repeat(NAME_MAX)), null)
})

test('validName agrees with nameIssue', () => {
  for (const name of ['', 'a', 'Alex', 'Guest-4211', 'shit', 'a'.repeat(NAME_MAX + 1)]) {
    assert.equal(validName(name), nameIssue(name) === null, name)
  }
})

test('sanitizeName strips what Firestore should never see', () => {
  assert.equal(sanitizeName('  Alex  '), 'Alex')
  assert.equal(sanitizeName(`A${CTRL}lex`), 'Alex')
  assert.equal(sanitizeName('Big    Dog'), 'Big Dog')
  // Control characters go before whitespace is collapsed, so a name broken up
  // by newlines or tabs closes up instead of gaining a space.
  assert.equal(sanitizeName('Big\n\tDog'), 'BigDog')
})

test('sanitizeName clamps to the posted length limit', () => {
  const long = 'abcdefghijklmnopqrstuvwxyz'
  assert.equal(sanitizeName(long).length, NAME_MAX)
  assert.equal(sanitizeName(long), long.slice(0, NAME_MAX))
})

test('a sanitized name of reasonable length is always postable', () => {
  // The invariant submitScore relies on: whatever the player typed, the
  // string that reaches the server is within the bounds the rules enforce.
  for (const raw of ['  Alex  ', 'Big    Dog', 'abcdefghijklmnopqrstuvwxyz', `A${CTRL}lex`]) {
    const clean = sanitizeName(raw)
    assert.ok(clean.length >= NAME_MIN && clean.length <= NAME_MAX, `"${raw}" -> "${clean}"`)
  }
})

test('isGuestName matches only handles this app minted', () => {
  assert.equal(isGuestName('Guest-4211'), true)
  assert.equal(isGuestName('  Guest-4211  '), true)
  assert.equal(isGuestName('Guest-42'), false)
  assert.equal(isGuestName('Guest-42110'), false)
  assert.equal(isGuestName('guest-4211'), false)
  assert.equal(isGuestName('Guest'), false)
  assert.equal(isGuestName('Alex'), false)
})
