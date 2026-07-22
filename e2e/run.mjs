/**
 * End-to-end suite: builds the app (with dummy Firebase env so the
 * leaderboard UI is enabled), serves it, and drives it in headless
 * Chromium with Dog.CEO and Firestore mocked at the network layer.
 *
 *   npm run test:e2e
 *
 * Set CHROMIUM_PATH to use a pre-installed browser instead of
 * Playwright's managed one.
 */
import { spawn, execSync } from 'node:child_process'
import { chromium } from 'playwright'

const PORT = 4179
const REVEAL_WAIT = 1400 // app's reveal is 1200ms

const JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==',
  'base64',
)
const NAME = { pug: 'Pug', husky: 'Husky', beagle: 'Beagle', boxer: 'Boxer' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let failures = 0
const ok = (m) => console.log('  PASS', m)
const fail = (m) => { console.error('  FAIL', m); failures++ }

console.log('building (dist-e2e, leaderboard enabled)…')
execSync('npx vite build --outDir dist-e2e', {
  stdio: 'inherit',
  env: { ...process.env, VITE_FB_PROJECT_ID: 'e2e-project', VITE_FB_API_KEY: 'e2e-key' },
})
const server = spawn('npx', ['vite', 'preview', '--outDir', 'dist-e2e', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
})
process.on('exit', () => server.kill())
for (let i = 0; ; i++) {
  try {
    await fetch(`http://localhost:${PORT}/`)
    break
  } catch {
    if (i > 40) throw new Error('preview server never came up')
    await sleep(250)
  }
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })

/** New page with dog.ceo mocked; imageDelay slows round-building. */
async function newGamePage({ imageDelay = 0 } = {}) {
  const page = await browser.newPage()
  await page.route('https://dog.ceo/api/breeds/list/all', (r) =>
    r.fulfill({ json: { message: { pug: [], husky: [], beagle: [], boxer: [] }, status: 'success' } }))
  await page.route(/https:\/\/dog\.ceo\/api\/breed\/(\w+)\/images\/random/, async (r) => {
    if (imageDelay) await sleep(imageDelay)
    const breed = r.request().url().match(/breed\/(\w+)\//)[1]
    await r.fulfill({ json: { message: `https://images.dog.ceo/${breed}.jpg`, status: 'success' } })
  })
  await page.route(/https:\/\/images\.dog\.ceo\/.*/, (r) => r.fulfill({ contentType: 'image/jpeg', body: JPEG }))
  await page.goto(`http://localhost:${PORT}/`)
  await page.waitForSelector('.mode-card', { timeout: 8000 })
  return page
}

/** The current round's answer is encoded in the mocked image URL. */
const clickAnswer = async (page, correct) => {
  const right = NAME[(await page.getAttribute('.dog-card img', 'src')).match(/([a-z]+)\.jpg/)[1]]
  await page.waitForSelector('.answer:not([disabled])')
  const labels = await page.$$eval('.answer', (els) => els.map((e) => e.textContent))
  await page.click(`.answer:has-text("${correct ? right : labels.find((l) => l !== right)}")`)
}

// ---- Suite 1: streak golden path ----
console.log('suite: streak game')
{
  const page = await newGamePage()
  await page.click('.mode-card:has-text("Endless Streak")')
  await page.waitForSelector('.answer', { timeout: 8000 })
  await clickAnswer(page, true); await sleep(REVEAL_WAIT)
  await clickAnswer(page, true); await sleep(REVEAL_WAIT)
  const missed = NAME[(await page.getAttribute('.dog-card img', 'src')).match(/([a-z]+)\.jpg/)[1]]
  await clickAnswer(page, false)
  await page.waitForSelector('.gameover', { timeout: 4000 })
  const score = await page.textContent('.final-score')
  score === '2' ? ok('score 2 after two correct') : fail(`score ${score}, want 2`)
  const line = await page.textContent('.missed-line').catch(() => null)
  line?.includes(missed) ? ok('missed breed revealed') : fail(`missed line: ${line}`)

  // quitting a fresh game must stay quit even with a prefetch in flight
  await page.click('.btn-filled:has-text("Play again")')
  await page.waitForSelector('.answer', { timeout: 8000 })
  await page.click('.appbar-icon[aria-label="Back"]')
  await page.waitForSelector('.mode-card', { timeout: 4000 })
  await sleep(2000)
  ;(await page.$('.mode-card')) ? ok('quit sticks') : fail('yanked back into game')
  await page.close()
}

// ---- Suite 2: blitz best isolation + recovery under slow network ----
console.log('suite: blitz')
{
  const page = await newGamePage()
  await page.click('.mode-card:has-text("Blitz")')
  await page.waitForSelector('.answer', { timeout: 8000 })
  await clickAnswer(page, true); await sleep(REVEAL_WAIT)
  await clickAnswer(page, true); await sleep(REVEAL_WAIT)
  const bs = await page.evaluate(() => localStorage.getItem('doggo.bestStreak'))
  bs === '0' ? ok('blitz leaves bestStreak alone') : fail(`bestStreak ${bs}, want 0`)
  await page.close()
}
{
  // regression: wrong answer before the next round has prefetched used to
  // strand the game on the loading screen forever
  const page = await newGamePage({ imageDelay: 2500 })
  await page.click('.mode-card:has-text("Blitz")')
  await page.waitForSelector('.answer', { timeout: 15000 })
  await clickAnswer(page, false)
  await sleep(REVEAL_WAIT)
  try {
    await page.waitForSelector('.answer:not([disabled])', { timeout: 8000 })
    ok('recovers when round advances with nothing prefetched')
  } catch {
    fail('stuck on loading screen')
  }
  await page.close()
}

// ---- Suite 2b: a broken visible image self-heals ----
console.log('suite: broken-image recovery')
{
  const page = await browser.newPage()
  let n = 0
  const hits = new Map()
  await page.route('https://dog.ceo/api/breeds/list/all', (r) =>
    r.fulfill({ json: { message: { pug: [], husky: [], beagle: [], boxer: [] }, status: 'success' } }))
  await page.route(/https:\/\/dog\.ceo\/api\/breed\/(\w+)\/images\/random/, (r) => {
    const breed = r.request().url().match(/breed\/(\w+)\//)[1]
    r.fulfill({ json: { message: `https://images.dog.ceo/${breed}/img-${++n}.jpg`, status: 'success' } })
  })
  // Fail the SECOND request to any given URL: the preload (1st hit) succeeds so
  // the round is shown, but the visible <img> (2nd hit) 404s — exactly the
  // "preloaded fine, rendered broken" case the onError fallback handles.
  await page.route(/https:\/\/images\.dog\.ceo\/.*/, (r) => {
    const url = r.request().url()
    const c = (hits.get(url) || 0) + 1
    hits.set(url, c)
    if (c === 2) return r.fulfill({ status: 404, body: 'nope' })
    return r.fulfill({ contentType: 'image/jpeg', body: JPEG })
  })
  await page.goto(`http://localhost:${PORT}/`)
  await page.waitForSelector('.mode-card', { timeout: 8000 })
  await page.click('.mode-card:has-text("Endless Streak")')
  await page.waitForSelector('.dog-card img', { timeout: 8000 })
  await page
    .waitForFunction(() => {
      const img = document.querySelector('.dog-card img')
      return img && img.complete && img.naturalWidth > 0
    }, { timeout: 8000 })
    .then(() => ok('broken visible image self-heals'))
    .catch(() => fail('dog image stayed blank after render error'))
  await page.close()
}

// ---- Suite 3: leaderboard against mocked Firestore ----
console.log('suite: leaderboard')
{
  const page = await newGamePage()
  const store = { web_leaderboard_streak: [], web_leaderboard_blitz: [] }
  await page.route(/https:\/\/firestore\.googleapis\.com\/.*/, async (route) => {
    const url = route.request().url()
    const body = route.request().postDataJSON()
    if (url.includes(':runQuery')) {
      const col = body.structuredQuery.from[0].collectionId
      const rows = [...(store[col] ?? [])]
        .sort((a, b) => Number(b.score.integerValue) - Number(a.score.integerValue))
        .slice(0, body.structuredQuery.limit ?? 10)
        .map((fields) => ({ document: { fields } }))
      return route.fulfill({ json: rows.length ? rows : [{ readTime: 'now' }] })
    }
    const m = url.match(/documents\/(web_leaderboard_\w+)\?/)
    if (m) {
      store[m[1]].push(body.fields)
      return route.fulfill({ json: { name: 'projects/e2e/databases/(default)/documents/' + m[1] + '/d1' } })
    }
    return route.fulfill({ status: 404, json: {} })
  })

  ;(await page.$('.appbar-icon[aria-label="Leaderboard"]')) ? ok('entry point on home') : fail('no leaderboard button')
  await page.click('.mode-card:has-text("Endless Streak")')
  await page.waitForSelector('.answer', { timeout: 8000 })
  await clickAnswer(page, true); await sleep(REVEAL_WAIT)
  await clickAnswer(page, false)
  await page.waitForSelector('.gameover', { timeout: 4000 })
  await page.fill('.nick-input', 'TestDog')
  await page.click('.btn-tonal:has-text("Post score")')
  await page.waitForSelector('.post-note.posted', { timeout: 4000 })
  const posted = store.web_leaderboard_streak[0]
  posted?.name?.stringValue === 'TestDog' && posted?.score?.integerValue === '1'
    ? ok('posted payload matches (TestDog, 1)')
    : fail('payload: ' + JSON.stringify(posted))
  await page.click('.btn-text.inline')
  await page.waitForSelector('.board-row:not(.skeleton)', { timeout: 4000 })
  const row = await page.textContent('.board-row')
  row.includes('TestDog') ? ok('board shows the entry') : fail('board row: ' + row)
  await page.click('.seg:has-text("Blitz")')
  await page.waitForSelector('.board-empty', { timeout: 4000 })
  ok('empty state on the other mode')
  await page.close()
}

await browser.close()
server.kill()
if (failures) {
  console.error(`\n${failures} failure(s)`)
  process.exit(1)
}
console.log('\nALL OK')
