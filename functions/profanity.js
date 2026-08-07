// Server-side mirror of src/game/profanity.ts. Keep the two in sync — the
// client filter is a UX gate; this copy is the enforced one.

const BLOCKED = [
  'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'dick', 'pussy', 'bastard',
  'slut', 'whore', 'wank', 'twat', 'prick', 'dildo', 'cock', 'boner',
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'rape', 'rapist', 'nazi',
  'coon', 'spic', 'kike', 'chink', 'tranny', 'molest', 'pedo',
]

const LEET = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't',
  '8': 'b', '@': 'a', $: 's', '!': 'i', '|': 'i',
}

function normalize(s) {
  return String(s)
    .toLowerCase()
    .split('')
    .map((c) => LEET[c] || c)
    .join('')
    .replace(/[^a-z]/g, '')
    .replace(/(.)\1+/g, '$1')
}

function isClean(name) {
  const n = normalize(name)
  if (!n) return true
  return !BLOCKED.some((word) => n.includes(word))
}

module.exports = { isClean }
