// Cloud Function: the server-side, enforced writer for the Doggo leaderboard.
//
// Deploy:  cd functions && npm install && firebase deploy --only functions
// Then set VITE_LEADERBOARD_WRITE_URL in the web app to this function's URL,
// redeploy the site, and flip `allow create` to `if false` in firestore.rules
// so direct client writes (which skip these checks) are blocked.

const { onRequest } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { isClean } = require('./profanity')

initializeApp()
const db = getFirestore()

const MODES = new Set(['streak', 'blitz'])
const NAME_MIN = 2
const NAME_MAX = 12
const SCORE_MIN = 1
const SCORE_MAX = 10000
const RATE_WINDOW_MS = 5000 // at most one post per IP per this window

function sanitizeName(name) {
  return String(name || '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX)
}

exports.submitScore = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }

  const { mode, name, score } = req.body || {}

  if (!MODES.has(mode)) {
    res.status(400).json({ error: 'invalid mode' })
    return
  }
  const cleanName = sanitizeName(name)
  if (cleanName.length < NAME_MIN || cleanName.length > NAME_MAX) {
    res.status(400).json({ error: 'invalid name length' })
    return
  }
  if (!isClean(cleanName)) {
    res.status(400).json({ error: 'name rejected' })
    return
  }
  const s = Math.round(Number(score))
  if (!Number.isFinite(s) || s < SCORE_MIN || s > SCORE_MAX) {
    res.status(400).json({ error: 'invalid score' })
    return
  }

  // Best-effort per-IP rate limit via a transactional marker doc.
  const ip = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() || req.ip || 'unknown'
  const rlRef = db.collection('rate_limits').doc(Buffer.from(ip).toString('hex').slice(0, 128))
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(rlRef)
      const now = Date.now()
      const last = snap.exists ? snap.get('last') || 0 : 0
      if (now - last < RATE_WINDOW_MS) throw new Error('__rate__')
      tx.set(rlRef, { last: now })
    })
  } catch (e) {
    if (e && e.message === '__rate__') {
      res.status(429).json({ error: 'slow down' })
      return
    }
    // A transient rate-limit failure shouldn't block a legitimate post.
  }

  await db.collection(`web_leaderboard_${mode}`).add({
    name: cleanName,
    score: s,
    createdAt: FieldValue.serverTimestamp(),
  })

  res.json({ ok: true })
})
