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
  // This test exists to make the behaviour a decision, not a surprise.
  assert.equal(isClean('Scunthorpe'), false)
})
