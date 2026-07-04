# Implement Expenses API handler

**Priority:** high
**Depends on:** 3 (event engine), 4 (split engine), 5 (router)
**Status:** TODO

## Description

Create `src/api/expenses.js` — handlers for adding expenses to a group.

## Tasks

- [ ] `POST /api/groups/:id/expenses` — adds a new expense
  - Parse form data: `description`, `total`, `paidBy` (member + amount), `splitStrategy` (`equal` | `shares` | `custom`), `shares` (per-member ratio or amount)
  - Validate: description required, total > 0, at least one payer, valid split strategy
  - Use split engine to compute per-person amounts
  - Create and store `EXPENSE_ADDED` event
  - Return updated group detail HTML via `render('group-detail', data)`
- [ ] `GET .../expenses` (if needed) — list expenses for a group (via template)
- [ ] Include payer selection and split strategy inputs in the form rendering
- [ ] No manual HTML string concatenation — always use the template renderer

## Acceptance criteria

- Creating an expense with strategy `equal` splits total equally among all participants
- Creating an expense with strategy `shares` splits by given ratios
- Creating an expense with strategy `custom` uses exact amounts
- Invalid data returns appropriate error feedback
- Event is stored and balances update correctly
