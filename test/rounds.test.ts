import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Breed } from '../src/game/api'
import { pickDistractors } from '../src/game/rounds'

const b = (path: string): Breed => ({ path, name: path })
const parent = (path: string) => path.split('/')[0]

// A pool with several sibling groups, so "prefer a different parent" is
// actually testable rather than trivially satisfied.
const POOL: Breed[] = [
  'retriever/golden',
  'retriever/flatcoated',
  'retriever/chesapeake',
  'terrier/border',
  'terrier/scottish',
  'bulldog/french',
  'bulldog/english',
  'pug',
  'husky',
  'beagle',
].map(b)

test('always returns three distractors, and never the answer', () => {
  const answer = b('retriever/golden')
  for (let i = 0; i < 50; i++) {
    const picked = pickDistractors(POOL, answer)
    assert.equal(picked.length, 3)
    assert.ok(!picked.some((p) => p.path === answer.path))
  }
})

test('never repeats a distractor', () => {
  const answer = b('retriever/golden')
  for (let i = 0; i < 50; i++) {
    const paths = pickDistractors(POOL, answer).map((p) => p.path)
    assert.equal(new Set(paths).size, 3, `duplicate in ${paths.join(', ')}`)
  }
})

test('avoids siblings of the answer when the pool allows it', () => {
  // A round decided between two retriever sub-breeds is a coin flip, not a
  // question — with enough other parents available, siblings stay out.
  const answer = b('retriever/golden')
  for (let i = 0; i < 50; i++) {
    const picked = pickDistractors(POOL, answer)
    assert.ok(
      !picked.some((p) => parent(p.path) === 'retriever'),
      `sibling leaked in: ${picked.map((p) => p.path).join(', ')}`,
    )
  }
})

test('falls back to siblings rather than returning a short list', () => {
  // Only two non-retriever breeds exist here, so one sibling has to be used
  // to fill the fourth answer slot.
  const small = ['retriever/golden', 'retriever/flatcoated', 'retriever/chesapeake', 'pug', 'husky'].map(b)
  const answer = b('retriever/golden')
  for (let i = 0; i < 25; i++) {
    const picked = pickDistractors(small, answer)
    assert.equal(picked.length, 3)
    assert.equal(new Set(picked.map((p) => p.path)).size, 3)
    assert.ok(!picked.some((p) => p.path === answer.path))
  }
})

test('a pool with too few breeds returns what there is instead of throwing', () => {
  assert.equal(pickDistractors([b('pug'), b('husky')], b('pug')).length, 1)
  assert.equal(pickDistractors([b('pug')], b('pug')).length, 0)
})

test('the choice of distractors varies between rounds', () => {
  // Guards against a shuffle that quietly stops shuffling.
  const answer = b('pug')
  const seen = new Set<string>()
  for (let i = 0; i < 60; i++) {
    seen.add(
      pickDistractors(POOL, answer)
        .map((p) => p.path)
        .sort()
        .join('|'),
    )
  }
  assert.ok(seen.size > 1, 'distractors were identical across 60 rounds')
})
