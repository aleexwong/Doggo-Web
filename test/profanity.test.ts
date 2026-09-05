import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isClean } from '../src/game/profanity'

test('lets ordinary names through', () => {
  for (const name of ['Alex', 'Doggo Fan', 'Guest-4211', 'Ünïcode', '大和', 'x_1']) {
    assert.equal(isClean(name), true, `expected "${name}" to be allowed`)
  }
})

test('blocks a plain blocked word in any case', () => {
  assert.equal(isClean('shit'), false)
  assert.equal(isClean('SHIT'), false)
  assert.equal(isClean('ShItLord'), false)
})

test('blocks words that contain a double letter', () => {
  // Regression: normalizing used to collapse repeats in the name, so "nigger"
  // became "niger" and matched nothing in the list. Every word here was
  // allowed straight onto the public board.
  for (const word of ['nigger', 'nigga', 'coon', 'asshole', 'pussy', 'faggot']) {
    assert.equal(isClean(word), false, `"${word}" was allowed`)
  }
})

test('a doubled letter in the name is not required to be doubled in the word', () => {
  assert.equal(isClean('shiiit'), false)
  assert.equal(isClean('cooon'), false)
  assert.equal(isClean('assshole'), false)
})

test('sees through leet substitutions', () => {
  assert.equal(isClean('sh1t'), false)
  assert.equal(isClean('f4g'), false)
  assert.equal(isClean('$hit'), false)
  assert.equal(isClean('b1tch'), false)
})

test('sees through padding characters and repeats', () => {
  assert.equal(isClean('f.u.c.k'), false)
  assert.equal(isClean('f u c k'), false)
  assert.equal(isClean('fuuuuck'), false)
  assert.equal(isClean('sshhiitt'), false)
})

test('treats a name with nothing left after normalizing as clean', () => {
  // Nothing to match against, so there is no reason to reject it — length
  // checks in nameIssue are what stop these being posted.
  assert.equal(isClean(''), true)
  assert.equal(isClean('!!!'), true)
  assert.equal(isClean('1234'), true)
})

test('documents the Scunthorpe tradeoff: substring matching over-blocks', () => {
  // Known and accepted: matching is substring-based, so an innocent name that
  // embeds a blocked word is refused. Guest posting is the escape hatch.
  // These tests exist to make the behaviour a decision, not a surprise.
  assert.equal(isClean('Scunthorpe'), false)
  assert.equal(isClean('Raccoon'), false)
})

test('a repeated letter does not drag an innocent name into a match', () => {
  // The cost of tolerating repeats would be names like these, if the doubled
  // letters in the word were optional rather than required.
  for (const name of ['Connor', 'Cooper', 'Balloon Dog', 'Bassett', 'Doggo Fan']) {
    assert.equal(isClean(name), true, `"${name}" was refused`)
  }
})
