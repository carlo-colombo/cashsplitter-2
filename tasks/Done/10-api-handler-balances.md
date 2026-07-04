# Implement Balances & Settlements API handler

**Priority:** high
**Depends on:** 3 (event engine), 5 (router)
**Status:** TODO

## Description

Create `src/api/balances.js` — handlers for computing and displaying balances and optimized settlements.

## Tasks

- [ ] `GET /api/groups/:id/balances` — raw balances
  - Project state, compute net per-person balances
  - Call `render('settlements', { balances, mode: 'raw' })` for HTML output
  - Include toggle button to switch to optimized view
- [ ] `GET /api/groups/:id/settlements` — optimized settlements
  - Compute minimal set of transactions to settle all debts
  - Call `render('settlements', { settlements, mode: 'optimized' })` for HTML output
  - Include toggle button to switch back to raw balances
- [ ] Optimized settlement algorithm: greedy approach matching highest creditor with highest debtor
- [ ] No manual HTML string concatenation — always use the template renderer

## Acceptance criteria

- Raw balances show correct net amounts per person
- Optimized settlements reduce total number of transactions
- Toggle between views works via HTMX (hx-get swapping content)
- Edge case: all settled shows "All settled up!" message
