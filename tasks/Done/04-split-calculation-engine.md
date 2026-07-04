# Implement split calculation engine

**Priority:** high
**Depends on:** 1 (scaffold)
**Status:** TODO

## Description

Create `src/lib/split.js` — pure functions for the three split strategies.

## Tasks

- [ ] `splitEqual(total, participants)` — returns `{ [userId]: amount }` equally divided
- [ ] `splitByShares(total, shares)` — accepts `{ [userId]: ratio }`, divides proportionally:
  - e.g. `{ a: 2, b: 1, c: 1 }` with total 40 → `{ a: 20, b: 10, c: 10 }`
- [ ] `splitCustom(amounts)` — validates that amounts sum to total, returns as-is
- [ ] Handle rounding gracefully (distribute remainder cents to first participant)
- [ ] Export all functions for use in API handlers

## Acceptance criteria

- All strategies return correct per-person amounts
- Rounding edge cases handled (e.g. 100 ÷ 3 = 33.34 + 33.33 + 33.33)
- Pure functions, no side effects
