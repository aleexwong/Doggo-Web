// Client-side profanity guard for leaderboard names. This is a UX gate, not
// real enforcement — a determined user can bypass any client check (see the
// server-side note in the README), but it keeps obvious slurs and swearing off
// the public board for normal users.
//
// Tradeoff: matching is substring-based on a normalized form, so it can catch
// an innocent name that embeds a blocked word (the classic "Scunthorpe
// problem"). Guest posting (guestName) is the clean escape hatch for anyone
// caught by a false positive.
//
// The word list itself lives in functions/ because `firebase deploy` packages
// only that directory — a file anywhere else would never reach the server.
// Vite inlines this JSON at build time, so both filters read one list, and
// test/profanity-parity.test.ts checks they still agree on the answer.
import words from '../../functions/profanity-words.json'

// Curated, lowercase, letters-only. Bare short words prone to false positives
// (e.g. "ass") are intentionally omitted in favour of their compound forms.
const BLOCKED: string[] = words.blocked
// Common leet substitutions, so "sh1t" / "f4g" still normalize to the word.
const LEET: Record<string, string> = words.leet

function normalize(s: string): string {
  return s
    .toLowerCase()
    .split('')
    .map((c) => LEET[c] ?? c)
    .join('')
    .replace(/[^a-z]/g, '') // drop spaces, digits, punctuation
}

// Repeats are tolerated by the pattern rather than squeezed out of the name:
// "fuck" becomes /f+u+c+k+/, which still catches "fuuuck" but keeps the double
// letters in words that have them. Collapsing the name instead used to turn
// "nigger" into "niger", which then matched nothing in the list. Words come
// from a curated letters-only list, so there is nothing to escape.
const PATTERNS = BLOCKED.map(
  (word) =>
    new RegExp(
      word
        .split('')
        .map((c) => `${c}+`)
        .join(''),
    ),
)

/** True if the name has no blocked term in its normalized form. */
export function isClean(name: string): boolean {
  const n = normalize(name)
  if (!n) return true
  return !PATTERNS.some((re) => re.test(n))
}
