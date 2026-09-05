import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Breed, fetchBreeds, fetchRandomImage } from '../src/game/api'

type Handler = (url: string) => { ok?: boolean; status?: number; body?: unknown } | Promise<never>

/** Run `fn` with global fetch replaced, then put the real one back. */
async function withFetch<T>(handler: Handler, fn: () => Promise<T>): Promise<T> {
  const real = globalThis.fetch
  globalThis.fetch = (async (input: string | URL | Request) => {
    const res = await handler(String(input))
    return {
      ok: res.ok ?? true,
      status: res.status ?? 200,
      json: async () => res.body,
    }
  }) as typeof fetch
  try {
    return await fn()
  } finally {
    globalThis.fetch = real
  }
}

const listing = (message: Record<string, string[]>) => () => ({ body: { message } })
const nameOf = (breeds: Breed[], path: string) => breeds.find((x) => x.path === path)?.name

test('turns the API listing into playable display names', async () => {
  const breeds = await withFetch(
    listing({
      bulldog: ['french', 'english'],
      cotondetulear: [],
      german: ['shepherd', 'longhair'],
      hound: ['afghan'],
      retriever: ['golden', 'flatcoated'],
      stbernard: [],
      terrier: ['westhighland'],
    }),
    fetchBreeds,
  )

  // Sub-breed first, because that is how the name is spoken.
  assert.equal(nameOf(breeds, 'retriever/golden'), 'Golden Retriever')
  assert.equal(nameOf(breeds, 'hound/afghan'), 'Afghan Hound')
  assert.equal(nameOf(breeds, 'bulldog/french'), 'French Bulldog')
  // …except where the breed token is the adjective.
  assert.equal(nameOf(breeds, 'german/shepherd'), 'German Shepherd')
  assert.equal(nameOf(breeds, 'german/longhair'), 'German Longhair')
  // Squashed multi-word tokens are spelled out.
  assert.equal(nameOf(breeds, 'cotondetulear'), 'Coton de Tulear')
  assert.equal(nameOf(breeds, 'stbernard'), 'St Bernard')
  assert.equal(nameOf(breeds, 'terrier/westhighland'), 'West Highland Terrier')
  assert.equal(nameOf(breeds, 'retriever/flatcoated'), 'Flat-coated Retriever')
})

test('a breed with no sub-breeds becomes one entry, not a parent plus children', async () => {
  const breeds = await withFetch(
    listing({ pug: [], husky: [], retriever: ['golden', 'chesapeake'] }),
    fetchBreeds,
  )
  assert.deepEqual(breeds.map((x) => x.path).sort(), [
    'husky',
    'pug',
    'retriever/chesapeake',
    'retriever/golden',
  ])
})

test('drops denylisted breeds', async () => {
  const breeds = await withFetch(
    listing({ mix: [], pug: [], husky: [], beagle: [], boxer: [] }),
    fetchBreeds,
  )
  // "mix" photos are ambiguous, so they can never be a fair answer.
  assert.ok(!breeds.some((x) => x.path === 'mix'))
  assert.equal(breeds.length, 4)
})

test('falls back to the bundled list instead of leaving the grid empty', async () => {
  const cases: [string, Handler][] = [
    ['an HTTP error', () => ({ ok: false, status: 500 })],
    ['a network failure', () => Promise.reject(new Error('offline'))],
    ['a malformed body', () => ({ body: { nope: true } })],
    // Fewer than four breeds cannot fill a four-answer round.
    ['too few breeds', listing({ pug: [], husky: [] })],
  ]
  for (const [why, handler] of cases) {
    const breeds = await withFetch(handler, fetchBreeds)
    assert.ok(breeds.length >= 4, `${why}: expected the fallback list`)
    assert.ok(
      breeds.some((x) => x.path === 'pug'),
      `${why}: expected the fallback list`,
    )
  }
})

test('fetchRandomImage returns the photo URL', async () => {
  const url = await withFetch(
    (u) => {
      assert.equal(u, 'https://dog.ceo/api/breed/retriever/golden/images/random')
      return { body: { message: 'https://images.dog.ceo/golden.jpg' } }
    },
    () => fetchRandomImage({ path: 'retriever/golden', name: 'Golden Retriever' }),
  )
  assert.equal(url, 'https://images.dog.ceo/golden.jpg')
})

test('fetchRandomImage throws on an error response, so the round can retry', async () => {
  await assert.rejects(
    () =>
      withFetch(
        () => ({ ok: false, status: 404 }),
        () => fetchRandomImage({ path: 'pug', name: 'Pug' }),
      ),
    /404/,
  )
})
