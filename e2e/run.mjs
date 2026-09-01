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

/** New page with dog.ceo mocked; imageDelay slows round-building.
 *  `init` runs in the page before any app code (e.g. to break localStorage). */
async function newGamePage({ imageDelay = 0, init, query = '' } = {}) {
  const page = await browser.newPage()
  if (init) await page.addInitScript(init)
  await page.route('https://dog.ceo/api/breeds/list/all', (r) =>
    r.fulfill({ json: { message: { pug: [], husky: [], beagle: [], boxer: [] }, status: 'success' } }))
  await page.route(/https:\/\/dog\.ceo\/api\/breed\/(\w+)\/images\/random/, async (r) => {
    if (imageDelay) await sleep(imageDelay)
    const breed = r.request().url().match(/breed\/(\w+)\//)[1]
    await r.fulfill({ json: { message: `https://images.dog.ceo/${breed}.jpg`, status: 'success' } })
  })
  await page.route(/https:\/\/images\.dog\.ceo\/.*/, (r) => r.fulfill({ contentType: 'image/jpeg', body: JPEG }))
  await page.goto(`http://localhost:${PORT}/${query}`)
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

// ---- Suite 2c: storage-disabled (Safari private mode) doesn't crash ----
console.log('suite: storage resilience')
{
  const page = await newGamePage({
    init: () => {
      // Mimic a browser where localStorage access throws on write.
      const boom = () => {
        throw new Error('storage blocked')
      }
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get: () => ({ getItem: () => null, setItem: boom, removeItem: boom }),
      })
    },
  })
  await page.click('.mode-card:has-text("Endless Streak")')
  await page.waitForSelector('.answer', { timeout: 8000 })
  await clickAnswer(page, true) // saveBests would throw here without the guard
  await sleep(REVEAL_WAIT)
  const crashed = await page.$('.crash')
  const stillPlayable = await page.$('.answer')
  !crashed && stillPlayable
    ? ok('survives a throwing localStorage')
    : fail(crashed ? 'crashed on blocked storage' : 'game did not continue')
  await page.close()
}

// ---- Suite 2d: theme toggle flips and persists ----
console.log('suite: theme')
{
  const page = await newGamePage()
  const before = await page.getAttribute('html', 'data-theme')
  await page.click('.appbar-icon[aria-label^="Switch to"]')
  const after = await page.getAttribute('html', 'data-theme')
  const saved = await page.evaluate(() => localStorage.getItem('doggo.theme'))
  after !== before && after === saved
    ? ok(`theme toggles ${before} -> ${after} and persists`)
    : fail(`theme ${before} -> ${after}, stored ${saved}`)
  await page.reload()
  await page.waitForSelector('.mode-card', { timeout: 8000 })
  ;(await page.getAttribute('html', 'data-theme')) === after
    ? ok('theme survives a reload')
    : fail('theme reset on reload')
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

// ---- Suite 3b: arcade high-score table ----
console.log('suite: arcade board')
{
  const page = await newGamePage()
  const ROWS = [['Rufus', 42], ['Guest-4821', 32], ['Nala', 7]]
  await page.route(/https:\/\/firestore\.googleapis\.com\/.*/, (route) =>
    route.request().url().includes(':runQuery')
      ? route.fulfill({
          json: ROWS.map(([name, score]) => ({
            document: { fields: { name: { stringValue: name }, score: { integerValue: String(score) } } },
          })),
        })
      : route.fulfill({ json: {} }))
  await page.click('.appbar-icon[aria-label="Leaderboard"]')
  await page.waitForSelector('.board-row:not(.skeleton)', { timeout: 4000 })

  const ranks = await page.$$eval('.board-row', (els) => els.map((e) => e.querySelector('.board-rank').textContent))
  ranks.join(',') === '1ST,2ND,3RD' ? ok('ranks read 1ST/2ND/3RD') : fail('ranks: ' + ranks)

  const scores = await page.$$eval('.board-score', (els) => els.slice(1).map((e) => e.textContent))
  scores.join(',') === '042,032,007' ? ok('scores zero-padded') : fail('scores: ' + scores)

  // Guest handles are marked anonymous; chosen names are not.
  const anon = await page.$$eval('.board-row.anon', (els) => els.map((e) => e.textContent))
  anon.length === 1 && anon[0].includes('Guest-4821')
    ? ok('guest row marked anonymous')
    : fail('anon rows: ' + JSON.stringify(anon))
  ;(await page.$('.board-row.anon .ghost-mark'))
    ? ok('anonymous row carries a ghost')
    : fail('no ghost sprite on the guest row')
  await page.close()
}

// ---- Suite 4: profanity filter + guest posting ----
console.log('suite: guest + profanity')
{
  const page = await newGamePage()
  const store = { web_leaderboard_streak: [], web_leaderboard_blitz: [] }
  await page.route(/https:\/\/firestore\.googleapis\.com\/.*/, async (route) => {
    const url = route.request().url()
    const body = route.request().postDataJSON()
    if (url.includes(':runQuery')) return route.fulfill({ json: [{ readTime: 'now' }] })
    const m = url.match(/documents\/(web_leaderboard_\w+)\?/)
    if (m) {
      store[m[1]].push(body.fields)
      return route.fulfill({ json: { name: m[1] + '/d1' } })
    }
    return route.fulfill({ status: 404, json: {} })
  })
  await page.click('.mode-card:has-text("Endless Streak")')
  await page.waitForSelector('.answer', { timeout: 8000 })
  await clickAnswer(page, true); await sleep(REVEAL_WAIT)
  await clickAnswer(page, false)
  await page.waitForSelector('.gameover', { timeout: 4000 })

  // A profane name is rejected: Post disabled + hint shown, and a leet variant
  // is caught too.
  await page.fill('.nick-input', 'sh1tlord')
  const postBtn = page.locator('.post-row .btn-tonal')
  const blocked = await postBtn.isDisabled()
  const hint = await page.$('.post-hint')
  blocked && hint ? ok('profane name blocked (leet caught)') : fail('profane name was postable')

  // Guest posting works and lands a Guest-#### handle even from a bad name.
  await page.click('.guest-link')
  await page.waitForSelector('.post-note.posted', { timeout: 4000 })
  const guest = store.web_leaderboard_streak[0]?.name?.stringValue
  const isGuestHandle = /^Guest-\d{4}$/.test(guest || '')
  isGuestHandle ? ok(`guest posted as ${guest}`) : fail('guest name: ' + guest)
  await page.close()
}

// ---- Suite 5: frameless web presentation (?frame=web) ----
console.log('suite: frameless web')
{
  const page = await newGamePage({ query: '?frame=web' })
  const chrome = await page.$$eval('.phone, .statusbar, .gesturebar, .camera', (els) => els.length)
  const framed = await page.$('.web-frame')
  chrome === 0 && framed ? ok('device chrome is gone') : fail(`chrome nodes: ${chrome}, web-frame: ${!!framed}`)

  // Credits move onto the home screen, since there is no space under a phone.
  const credits = await page.locator('.home-credits').isVisible()
  const pageFooter = await page.locator('.page > .footer').isVisible()
  credits && !pageFooter ? ok('credits shown once, on the home screen') : fail(`credits ${credits}, footer ${pageFooter}`)

  // Still a working game, not just a working layout.
  await page.click('.mode-card:has-text("Endless Streak")')
  await page.waitForSelector('.answer', { timeout: 8000 })
  await clickAnswer(page, true)
  await sleep(REVEAL_WAIT)
  ;(await page.$('.answer.correct')) || (await page.$('.answer:not([disabled])'))
    ? ok('a round plays through frameless')
    : fail('round did not advance without the phone frame')
  await page.close()
}
{
  // The default presentation keeps the device, so existing embeds don't move.
  const page = await newGamePage()
  ;(await page.$('.phone')) ? ok('phone frame is still the default') : fail('default lost the phone frame')
  await page.close()
}

// ---- Suite 6: CRT presentation (?frame=arcade) ----
console.log('suite: crt')
{
  const page = await newGamePage({ query: '?frame=arcade' })
  const glass = await page.$('.crt-glass')
  const other = await page.$$eval('.phone, .web-frame', (els) => els.length)
  glass && other === 0 ? ok('tube replaces the other frames') : fail(`glass ${!!glass}, others ${other}`)

  // A CRT wants a dark picture, so it changes the untouched default...
  ;(await page.getAttribute('html', 'data-theme')) === 'dark'
    ? ok('crt defaults to the dark theme')
    : fail('crt did not default dark')
  await page.close()
}
{
  // ...but never overrides a choice the player already made.
  const page = await newGamePage({
    query: '?frame=arcade',
    init: () => localStorage.setItem('doggo.theme', 'light'),
  })
  ;(await page.getAttribute('html', 'data-theme')) === 'light'
    ? ok('a stored light choice still wins inside the crt')
    : fail('crt overrode a stored theme choice')
  await page.close()
}

await browser.close()
server.kill()
if (failures) {
  console.error(`\n${failures} failure(s)`)
  process.exit(1)
}
console.log('\nALL OK')
