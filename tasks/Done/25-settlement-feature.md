# 25 — Settlement Feature (User-to-User Payments)

## Summary

Add a **settlement feature** that allows one user to pay another user within a group, partially or fully settling a debt. Settlements are persisted as `LEDGER_ENTRY` events in the double-entry ledger.

---

## Motivation

Currently, the app only shows computed balances and optimized settlement proposals. There is no way to actually record that a debt was paid. Users need to be able to mark real-world payments between group members so the balances reflect actual payments.

---

## Requirements

### 1. New API Endpoint: Create Settlement

```
POST /api/groups/:id/settlements
```

Handler: `src/api/settlements.js` (new file) — or add to `src/api/balances.js`

**Form data:**
- `from`: user ID (the debtor — the one who pays)
- `to`: user ID (the creditor — the one who receives)
- `amount`: number (Euro string, e.g. "12.50")
- `description`: optional string (e.g. "settling dinner debt")

**Validation:**
- Both `from` and `to` must be members of the group
- `from` and `to` must be different users
- `amount` must be > 0
- Amount in cents after conversion must be > 0

**Flow:**
1. Read form data
2. Validate all fields
3. Create a `LEDGER_ENTRY` event:
   ```js
   {
     id: crypto.randomUUID(),
     groupId,
     from,      // debtor pays
     to,        // creditor receives
     amount,    // in cents
     description: description || `settlement`,
     expenseId: null,
     timestamp: new Date().toISOString()
   }
   ```
4. Re-read all events, re-project state
5. Return updated group detail view (or the balances section)

**Note on overpayment:** It is allowed. A user can pay more than they owe. The balance will go negative for the creditor and positive for the debtor. This is consistent with real-world accounting — people can overpay.

### 2. Settlement Form View

```
GET /api/groups/:id/settlements/form
```

Returns an HTML form (swap-in fragment) with:

- **Dropdown for `from`** (debtor): pre-select the user with the most negative balance, or let the user pick
- **Dropdown for `to`** (creditor): pre-select the user with the most positive balance, or let the user pick
- **Amount input**: text/number field (Euro format, e.g. "12.50")
- **Description input**: optional text field, default "settlement"
- **Submit button**: "Record Settlement"

**Smart defaults:** When opening the form from the balances view, pre-select the users based on which row the user clicked (e.g., clicking on "Alice owes Bob $10" opens the form with from=Alice, to=Bob, amount=10.00).

### 3. Settlement History

Add a "Settlements" section to the group detail view showing past settlements.

Settlements can be derived by filtering `LEDGER_ENTRY` events where `expenseId === null`. Show:
- Date
- From → To
- Amount
- Description

### 4. Balance View Updates

Update the balance view to distinguish between:
- **Gross balance**: computed from expense shares (what you're owed from expenses)
- **Net balance**: gross balance + settlements (what you're actually owed after payments)

Alternative: Keep it simple — just show net balance (current behavior, but now settlements actually affect it). The existing balance view already shows net balance.

### 5. Integration with Existing Views

- Add a "Record Settlement" button/link in the group detail view, below the balances table
- Add a "Settle Up" button next to each balance row (e.g., "Alice owes $10 → Settle")
- The existing optimized settlements view should reflect that recorded settlements are already factored into balances

### 6. Optimized Settlements

The existing `computeSettlements()` function generates the minimal set of transactions to settle all debts. This should:
- Show only **remaining** debts after recorded settlements
- Offer a "Settle All" button that creates all optimized settlement entries at once (optional, can be a future enhancement)

---

## Files to modify/create

| File | Changes |
|------|---------|
| `src/api/settlements.js` | **New file** — `form()` and `create()` handlers for settlements |
| `src/api/router.js` | Add two new routes: `GET .../settlements/form` and `POST .../settlements` |
| `src/api/balances.js` | Update settlement computation to work with persisted ledger entries |
| `src/views/settlements.html.hx.js` | Add settlement form rendering; show settlement history |
| `src/views/group-detail.html.hx.js` | Add "Record Settlement" button/area |
| `sw.js` | Add new settlement files to cache on install |

---

## Acceptance Criteria

- [ ] `POST /api/groups/:id/settlements` creates a `LEDGER_ENTRY` event (with `expenseId: null`)
- [ ] `GET /api/groups/:id/settlements/form` returns an HTML form
- [ ] Settlement form has smart defaults (pre-selected users based on context)
- [ ] After recording a settlement, balances update correctly
- [ ] Settlement history is visible in the group detail view
- [ ] Validation prevents: same `from` and `to`, zero/negative amounts, non-members
- [ ] Overpayments are allowed (no "cannot pay more than you owe" restriction)
- [ ] Existing optimized settlements view shows remaining debts after recorded settlements
- [ ] No data migration needed (fresh start is fine)

---

## E2E Tests

Add the following test scenarios to `tests/e2e/scenarios.spec.js` (or `tests/e2e/settlements.spec.js`):

### Test: Record a full settlement
1. Create a group with Alice and Bob
2. Add expense: €30 paid by Alice, split equal (Alice owes €15, Bob owes €15)
3. Open settlement form
4. Set from=Bob, to=Alice, amount=€15, description="settling dinner"
5. Submit
6. Verify: settlement appears in history, balances now show Alice +€0, Bob €0

### Test: Partial settlement
1. Create a group with Alice and Bob
2. Add expense: €30 paid by Alice, split equal
3. Record settlement: Bob → Alice, €10 (partial)
4. Verify: settlement history shows €10 payment
5. Verify: balances show Alice is owed €5, Bob owes €5

### Test: Overpayment allowed
1. Create a group with Alice and Bob
2. Add expense: €20 paid by Alice, split equal
3. Record settlement: Bob → Alice, €15 (Bob only owes €10)
4. Verify: settlement recorded successfully
5. Verify: balances reflect the overpayment (Bob has -€5, Alice has +€5 — flipped)

### Test: Settlement form smart defaults
1. Create a group with Alice, Bob, Charlie
2. Add expense: €30 paid by Alice, split equal (Alice +€20, Bob -€10, Charlie -€10)
3. Open settlement form from group detail
4. Verify: the debtor dropdown pre-selects the user with most negative balance
5. Verify: the creditor dropdown pre-selects the user with most positive balance

### Test: Validation — cannot settle with yourself
1. Create a group with Alice and Bob
2. Add an expense
3. Open settlement form, set from=Alice, to=Alice
4. Verify: validation error shown

### Test: Validation — zero amount rejected
1. Create a group with Alice and Bob
2. Add an expense
3. Open settlement form, set amount=0
4. Verify: validation error shown

### Test: Validation — non-member rejected
1. Create a group with Alice and Bob
2. Open settlement form
3. Attempt to submit with a non-existent user ID (if possible via direct form manipulation)
4. Verify: error returned

### Test: Settlement history visible in group detail
1. Create a group with Alice and Bob
2. Add expense, then record a settlement
3. Verify: group detail view shows the settlement in a "Settlements" section
4. Verify: amount, from, to, and description are all displayed

### Test: Optimized settlements reflect recorded settlements
1. Create a group with Alice (paid €60), Bob (paid €30), Charlie (paid €0), split equal among all 3
2. Record settlement: Charlie → Alice, €10
3. Open optimized settlements view
4. Verify: the optimized plan accounts for the €10 already paid (Charlie only needs to pay €20 more, not €30)

### Test: Settlement description optional
1. Create a group with Alice and Bob
2. Add expense, record settlement without description
3. Verify: default description "settlement" appears in history

---

## Dependencies

- Depends on task 23 (double-entry ledger) — settlements are `LEDGER_ENTRY` events
- Depends on task 24 (global users) — settlement references global user IDs
