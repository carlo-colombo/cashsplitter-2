# 28 — Delete Groups and Expenses (Immutable)

## Summary

Add delete buttons for groups and expenses while respecting the event-sourcing immutability constraint. "Deletion" is implemented by appending new `GROUP_DELETED` / `EXPENSE_DELETED` events to the event store, and filtering them out during state projection.

## What was built

### Group deletion
- Red **×** button on each group card in the groups list
- Confirmation dialog before deletion
- Appends a `GROUP_DELETED` event (`{ groupId }`)
- During `projectState`, groups with a matching deletion event are skipped (the `GROUP_CREATED` event is not projected)
- After deletion, user is redirected to the groups list view

### Expense deletion
- Red **×** button on each expense item in the group detail view
- Confirmation dialog before deletion
- Appends an `EXPENSE_DELETED` event (`{ groupId, expenseId }`)
- During `projectState`:
  - Expenses with a matching deletion event are skipped
  - `LEDGER_ENTRY` events that reference a deleted expense's `expenseId` are also skipped, so balances revert correctly
- After deletion, the group detail view is re-rendered with updated balances

## Files changed

| File | Change |
|------|--------|
| `src/db/events.js` | Added `GROUP_DELETED` + `EXPENSE_DELETED` constants; updated `projectState` to track deleted IDs in Sets and filter during projection |
| `src/api/groups.js` | Added `deleteGroup` handler; added `id` field to expense mapping in `buildGroupDetailData` |
| `src/api/expenses.js` | Added `deleteExpense` handler; added `id` field to expense mapping in `buildGroupDetailData` |
| `src/api/members.js` | Added `id` field to expense mapping in `buildGroupDetailData` |
| `src/api/settlements.js` | Added `id` field to expense mapping in inline group detail data |
| `src/api/router.js` | Added routes: `POST /groups/:id/delete` and `POST /groups/:id/expenses/:expenseId/delete` |
| `src/views/groups-list.html.hx` | Added delete button (`.btn-danger.btn-sm`) inside each group card |
| `src/views/group-detail.html.hx` | Added delete button (`.btn-danger.btn-sm.btn-icon`) on each expense item |
| `styles/app.css` | Added `.btn-danger`, `.btn-sm`, `.btn-icon`, `.group-card-header`, `.expense-item` styles |

## Testing

- All 61 unit tests pass
- All 22 E2E tests pass
- No regressions in existing functionality
