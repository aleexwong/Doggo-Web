// Server-side profanity filter for leaderboard names — the enforced one.
//
// The word list and the leet map are data, shared with the client filter in
// src/game/profanity.ts (see the note there for why they live in this
// directory). Only the few lines of matching below are written twice, and
// test/profanity-parity.test.ts checks the two agree.

const { blocked: BLOCKED, leet: LEET } = require('./profanity-words.json')

function normalize(s) {
  return String(s)
    .toLowerCase()
    .split('')
    .map((c) => LEET[c] || c)
    .join('')
    .replace(/[^a-z]/g, '')
}

// Repeats are tolerated by the pattern rather than squeezed out of the name —
// see the note in src/game/profanity.ts.
const PATTERNS = BLOCKED.map(
  (word) =>
    new RegExp(
      word
        .split('')
        .map((c) => `${c}+`)
        .join(''),
    ),
)

function isClean(name) {
  const n = normalize(name)
  if (!n) return true
  return !PATTERNS.some((re) => re.test(n))
}

module.exports = { isClean }
