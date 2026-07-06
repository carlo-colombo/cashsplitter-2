import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  splitEqual,
  splitByShares,
  splitCustom,
  validateCustomTotal,
} from '../../src/lib/split.js'

describe('splitEqual', () => {
  it('divides total equally among participants', () => {
    const result = splitEqual(3000, ['u1', 'u2', 'u3'])
    assert.deepEqual(result, { u1: 1000, u2: 1000, u3: 1000 })
  })

  it('distributes remainder pennies to first participants', () => {
    const result = splitEqual(1000, ['u1', 'u2', 'u3'])
    // 1000 / 3 = 333.33 -> floor 333, remainder 1
    assert.equal(result.u1, 334)
    assert.equal(result.u2, 333)
    assert.equal(result.u3, 333)
    assert.equal(result.u1 + result.u2 + result.u3, 1000)
  })

  it('handles single participant (pays all)', () => {
    const result = splitEqual(5000, ['u1'])
    assert.deepEqual(result, { u1: 5000 })
  })

  it('returns empty object for empty participants', () => {
    const result = splitEqual(1000, [])
    assert.deepEqual(result, {})
  })

  it('handles zero total', () => {
    const result = splitEqual(0, ['u1', 'u2'])
    assert.deepEqual(result, { u1: 0, u2: 0 })
  })

  it('handles large number of participants', () => {
    const participants = Array.from({ length: 10 }, (_, i) => `u${i}`)
    const result = splitEqual(10000, participants)
    const sum = Object.values(result).reduce((a, b) => a + b, 0)
    assert.equal(sum, 10000)
  })
})

describe('splitByShares', () => {
  it('divides total proportionally to shares', () => {
    const result = splitByShares(6000, { u1: 2, u2: 1 })
    // Total shares = 3, each share = 2000
    assert.equal(result.u1, 4000)
    assert.equal(result.u2, 2000)
  })

  it('last participant gets the remainder (penny handling)', () => {
    const result = splitByShares(1000, { u1: 1, u2: 1, u3: 1 })
    assert.equal(result.u1, 333)
    assert.equal(result.u2, 333)
    assert.equal(result.u3, 334)
    assert.equal(result.u1 + result.u2 + result.u3, 1000)
  })

  it('handles single participant', () => {
    const result = splitByShares(5000, { u1: 1 })
    assert.deepEqual(result, { u1: 5000 })
  })

  it('returns empty object for zero total shares', () => {
    const result = splitByShares(1000, { u1: 0, u2: 0 })
    assert.deepEqual(result, {})
  })

  it('handles unequal shares with penny remainder', () => {
    const result = splitByShares(1000, { u1: 3, u2: 2 })
    // 3/5 = 600, 2/5 = 400, remainder 0
    assert.equal(result.u1, 600)
    assert.equal(result.u2, 400)
    assert.equal(result.u1 + result.u2, 1000)
  })

  it('handles zero total amount', () => {
    const result = splitByShares(0, { u1: 2, u2: 1 })
    assert.deepEqual(result, { u1: 0, u2: 0 })
  })
})

describe('splitCustom', () => {
  it('returns the amounts as-is', () => {
    const result = splitCustom({ u1: 2000, u2: 3000 })
    assert.deepEqual(result, { u1: 2000, u2: 3000 })
  })

  it('handles single person', () => {
    const result = splitCustom({ u1: 5000 })
    assert.deepEqual(result, { u1: 5000 })
  })

  it('handles zero amounts', () => {
    const result = splitCustom({ u1: 0, u2: 0 })
    assert.deepEqual(result, { u1: 0, u2: 0 })
  })

  it('returns empty object for empty input', () => {
    const result = splitCustom({})
    assert.deepEqual(result, {})
  })
})

describe('validateCustomTotal', () => {
  it('returns true when sum matches expected', () => {
    assert.equal(validateCustomTotal({ u1: 2000, u2: 3000 }, 5000), true)
  })

  it('returns false when sum does not match expected', () => {
    assert.equal(validateCustomTotal({ u1: 2000, u2: 3000 }, 4000), false)
  })

  it('returns true for zero amounts', () => {
    assert.equal(validateCustomTotal({ u1: 0, u2: 0 }, 0), true)
  })

  it('handles single amount', () => {
    assert.equal(validateCustomTotal({ u1: 5000 }, 5000), true)
    assert.equal(validateCustomTotal({ u1: 5000 }, 4999), false)
  })
})
