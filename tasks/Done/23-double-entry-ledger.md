# 23 — Double-Entry Ledger Data Model

## Summary

Rework the core data model from simple balance tracking to a **double-entry ledger**. Every financial event (expense allocation, settlement) creates individual debit/credit `LEDGER_ENTRY` events in the event store. All split strategies must guarantee every cent is assigned (no rounding loss).

## Motivation

The current model directly mutates per-user balances during `projectState()`. This makes auditing difficult and prevents a clean settlement system. A double-entry ledger makes every financial movement explicit, traceable, and self-balancing.

---

## Requirements

### 1. New Event Type: `LEDGER_ENTRY`

Add a new event constant to `src/db/events.js`:

```js
export const LEDGER_ENTRY = 'LEDGER_ENTRY'
```

Event data shape:

```js
{
  id: string,           // UUID
  groupId: string,      // group this entry belongs to
  from: string,         // user ID (debtor — balance goes down)
  to: string,           // user ID (creditor — balance goes up)
  amount: number,       // cents (positive integer > 0)
  description: string,  // human-readable, e.g. "share of Dinner" or "settlement"
  expenseId: string | null,  // link back to the expense (null for settlements)
  timestamp: string     // ISO-8601
}
```

### 2. Balance Projection via Ledger Entries

Modify `projectState()` in `src/db/events.js`:

- Remove the old balance projection logic that directly adds/subtracts from balances on `EXPENSE_ADDED` and `PAYMENT_MADE` events.
- Add new balance projection logic that only reads `LEDGER_ENTRY` events:
  - For each ledger entry: `balance[groupId][entry.from] -= entry.amount; balance[groupId][entry.to] += entry.amount`
- Keep `groups`, `members`, `expenses`, `payments` (legacy) projections as-is for backward compat in views, BUT:

**Decision: Keep `EXPENSE_ADDED` as a journal/source event but make it non-balance-affecting.**

The `EXPENSE_ADDED` event continues to record the fact that an expense occurred (description, total, paidBy, split strategy). It is the **source document**. But balance impact now comes from `LEDGER_ENTRY` events generated from the split.

Similarly:
- `PAYMENT_MADE` event type can be **removed** (since settlements will also create `LEDGER_ENTRY` events). Or keep it for backward compatibility but don't use it for balance projection.

### 3. Penny Distribution — All Strategies

All three split strategies in `src/lib/split.js` must guarantee exact cent allocation:

- **Equal**: Already correct — `Math.floor(total / n)` with remainder distributed to first N. Output sum always equals total. ✅ No change needed.
- **Shares**: Already correct — last participant absorbs remainder. Output sum always equals total. ✅ No change needed.
- **Custom**: Currently a pass-through. **Must validate** at API level that `sum(amounts) === totalCents`. Already done in `validateCustomTotal()`. ✅ No change to split.js needed.

**However**, the `validateCustomTotal()` currently uses strict equality for cents. This should use `Math.round()` on each amount to ensure integer cents before comparison, to handle floating point edge cases from form inputs. Implement this fix.

### 4. Multiple Payers Support

Currently `EXPENSE_ADDED` has a single `paidBy` field. **Change it to support multiple payers.**

The `EXPENSE_ADDED` event `data` shape changes from:

```js
// OLD
{
  groupId, id, description, total,
  paidBy: string,         // single user ID
  split: { [userId]: amount },
  strategy: string
}

// NEW
{
  groupId, id, description, total,
  paidBy: { [userId]: amount },  // map of payer → amount paid (sum === total)
  split: { [userId]: amount },   // unchanged — map of participant → share
  strategy: string               // unchanged
}
```

The form data and API layer must accept multiple payers:
- The expense form needs a way to specify **who paid how much** (not just a single payer)
- Multiple `paidBy_<userId>` fields (one per member, default 0) similar to the current shares/amounts pattern

Multiple payers is a **precondition** for the ledger entry generation below — it's not optional.

### 5. Expense Creation Generates Ledger Entries

When an expense is added, we have:
- `paidBy`: `{ [userId]: amountPaid }` — who funded the expense (sum = total)
- `split`: `{ [userId]: shareAmount }` — who owes what (sum = total)

From these, generate `LEDGER_ENTRY` events. The exact algorithm to transform (paidBy, split) into ledger entries needs a decision. There are three viable approaches — choose one during implementation:

#### Option A: Net-based (simple & practical)

Compute net per participant: `net[user] = (paidBy[user] || 0) - (split[user] || 0)`

- Net **creditors** (net > 0): users who are owed money
- Net **debtors** (net < 0): users who owe money
- Net **zero** (net = 0): settled within the expense

Use the existing greedy matching algorithm (from `computeSettlements`) to create minimal `LEDGER_ENTRY` events from debtors to creditors, proportionally to their net amounts with penny rounding.

**Example:**
- Total: $30, Payers: {Alice: $20, Bob: $10}, Shares: {Alice: $10, Bob: $10, Charlie: $10}
- Net: Alice: +$10, Bob: $0, Charlie: -$10
- Ledger entries: Charlie → Alice, $10
- Result: Alice +$10, Charlie -$10, Bob $0 ✅

**Example 2:**
- Total: $50, Payers: {Alice: $30, Bob: $20}, Shares: {Alice: $10, Bob: $10, Charlie: $10, Diana: $10, Eve: $10}
- Net: Alice: +$20, Bob: +$10, Charlie: -$10, Diana: -$10, Eve: -$10
- Ledger entries: Charlie → Alice, $10; Diana → Alice, $10; Eve → Bob, $10
- (Or optimized: Charlie → Alice $6.67 + Bob $3.33, Diana → Alice $6.67 + Bob $3.33, Eve... → too many entries)

**Note:** With Option A, net creditors split the debtor's payment among themselves proportionally. The greedy algorithm handles this naturally.

#### Option B: Full proportional allocation (most auditable)

For **every participant** `p` with share `s`, distribute their share among **all payers** proportionally to what each payer paid:

```
totalPaid = sum(paidBy.values)
for each participant p with share s:
  for each payer payer with paidAmount pa:
    if p == payer: continue  // skip self
    amountOwed = splitByShares(s, paidBy)  // use split engine for penny-perfect distribution
    create LEDGER_ENTRY { from: p, to: payer, amount: amountOwed, ... }
```

**Example:**
- Total: $30, Payers: {Alice: $20, Bob: $10}, Shares: {Alice: $10, Bob: $10, Charlie: $10}
- Alice's share $10: Alice→Alice $6.67 (skip), Alice→Bob $3.33
- Bob's share $10: Bob→Alice $6.67, Bob→Bob $3.33 (skip)
- Charlie's share $10: Charlie→Alice $6.67, Charlie→Bob $3.33
- Entries: Alice→Bob $3.33, Bob→Alice $6.67, Charlie→Alice $6.67, Charlie→Bob $3.33
- Result: Alice: +$20 - $6.67 - $6.67 + $3.33 ... let me compute:
  - Alice: +$20 (paid) - $3.33 (Alice→Bob) - $6.67 (her share via Alice→... wait, her share isn't captured this way)

Hmm, this approach needs refinement. The share amounts need to be treated as money coming OUT of the participant. Let me reconsider.

Actually, in Option B the amount `s` for participant `p` means "p owes s total to the payers." The proportional split just determines who gets what portion. So:

- Alice owes $10 total. Payers: Alice ($20) and Bob ($10). Proportional: Alice gets 2/3 of Alice's $10 = $6.67, Bob gets 1/3 = $3.33. Skip Alice→Alice, create Alice→Bob $3.33. So Alice pays Bob $3.33. This means Alice overpaid and is reimbursing Bob? That's weird.

Wait, I think the confusion is that in Option B, the definition of payer is "person who fronted money" and the participant's share is "what they should pay." The entries represent who should transfer money to whom.

For Alice (paid $20, share $10):
- Net, Alice is owed $10
- But Option B creates Alice→Bob $3.33, which means Alice pays Bob $3.33? That's backwards!

The issue is that "from" in the ledger entry means the debtor. If Alice paid $20 and her share is $10, she should be a creditor, not a debtor.

I think the proportional approach needs to be:
- For each **non-payer** participant, their share is distributed to all payers proportionally
- For **payer-participants**, their payment is treated as them being owed money, and their share reduces what they're owed

Actually, I think the cleanest proportional approach is:

**All participants owe their share to the payers. The payers receive proportionally to what they paid.**

Algorithm:
```
For each participant p with share s:
  For each payer payr with amount pa:
    If p == payr: continue  // payer can't owe themselves
    amount = proportional(s, pa, totalPaid)  // with penny rounding
    create LEDGER_ENTRY { from: p, to: payr, amount }
```

But for payer-participants: they owe money TO themselves which we skip. Their payment is captured as them being a receiver of money from others. But their payment doesn't directly generate an entry — it's the RECEIVING end.

So the issue with Option B and payer-participants is:
- Alice paid $20, share $10
- Alice's share ($10) should go to payers: $6.67 to Alice (skip), $3.33 to Bob
- So Alice owes Bob $3.33? That's wrong because Alice is a net creditor.

The mental model is wrong. The proper double-entry view is:

**Phase 1 — Funding:** Each payer provides funds to the "expense pool"
- Alice gives $20 to the pool → Alice is a creditor to the pool
- Bob gives $10 to the pool → Bob is a creditor to the pool

**Phase 2 — Allocation:** Each participant consumes from the pool
- Alice consumes $10 → Alice is a debtor to the pool
- Bob consumes $10 → Bob is a debtor to the pool  
- Charlie consumes $10 → Charlie is a debtor to the pool

Net:
- Pool: +$20 + $10 - $10 - $10 - $10 = $0 (balanced)
- Alice: -$20 + $10 = -$10 (she's a net creditor: pool owes her $10)
- Bob: -$10 + $10 = $0 (settled)
- Charlie: +$10 (owes $10 to the pool)

Since the pool must settle to zero, Alice is owed $10 by the pool, meaning Charlie owes Alice $10 directly.

So the proper double-entry approach is to think in terms of net, which brings us back to Option A.

**I recommend Option A (net-based) as the default.** It's simpler, produces fewer entries, and is still perfectly auditable (each entry carries `expenseId` so you can trace back to the original expense).

#### Decision: Option A (Net-based)

Here's the precise algorithm:

```
Input:
  paidBy: { [userId]: amountInCents }   // sum = totalCents
  split:  { [userId]: amountInCents }   // sum = totalCents

Step 1: Compute net per user
  net = {}
  for each [userId, amount] in paidBy: net[userId] = (net[userId] || 0) + amount
  for each [userId, amount] in split:  net[userId] = (net[userId] || 0) - amount

Step 2: Separate debtors and creditors
  debtors = users where net < 0  (they owe money)
  creditors = users where net > 0  (they are owed money)
  // Users with net === 0 are settled — no entries needed

Step 3: Create ledger entries (greedy match)
  Sort debtors ascending (most negative first) and creditors descending (largest credit first)
  While debtors and creditors:
    debtor = debtors[0], creditor = creditors[0]
    amount = min(|net[debtor]|, net[creditor])
    create LEDGER_ENTRY { from: debtor, to: creditor, amount, expenseId, ... }
    net[debtor] += amount    // moving toward zero
    net[creditor] -= amount  // moving toward zero
    remove from lists if net === 0
```

This produces the minimal number of entries and guarantees all cents are assigned.

**Example:**
- $30 dinner, Alice paid $20, Bob paid $10, split equally among Alice, Bob, Charlie ($10 each)
- Net: Alice: +$10, Bob: $0, Charlie: -$10
- Only one entry needed: Charlie → Alice, $10

**Example with both multiple payers and penny distribution:**
- $10.00 lunch, Alice paid $6.00, Bob paid $4.00, split equally among Alice, Bob, Charlie
- Shares: Alice $3.34, Bob $3.33, Charlie $3.33
- Net: Alice: +$6.00 - $3.34 = +$2.66, Bob: +$4.00 - $3.33 = +$0.67, Charlie: $0 - $3.33 = -$3.33
- Greedy match: Charlie → Alice $2.66, Charlie → Bob $0.67
- Total entries: 2. All cents accounted for.

### 6. Single-Payer Expenses (Convenience)

For backward compatibility and convenience, the API should also accept a single `paidBy` string in the form data (not a map). Internally it converts to `{ [paidBy]: total }` before processing.

### 7. Expense Form UX for Multiple Payers

The expense form must support specifying how much each member paid:

- Each member gets a "paid" input field (default 0, in currency format)
- Pre-fill the first member with the full total (quick "single payer" flow)
- Validation: sum of paid amounts must equal the total

This means the form fields change from a single `paidBy` dropdown to multiple `paid_<userId>` inputs, similar to how custom split amounts work.

### 8. Remove Old Balance Logic

In `projectState()`, remove the code that directly manipulates balances on `EXPENSE_ADDED` and `PAYMENT_MADE`. Replace with the ledger-entry-based computation.

### 9. Data Migration

Since there are no real users, no migration is needed. The existing events in IndexedDB will be incompatible — that's acceptable. The app should handle the empty state gracefully (fresh start).

---

## Files to modify

| File | Changes |
|------|---------|
| `src/db/events.js` | Add `LEDGER_ENTRY` constant; update `createEvent()`; rewrite balance projection in `projectState()` to use ledger entries; update `EXPENSE_ADDED` data shape `paidBy` → map |
| `src/lib/split.js` | Add `Math.round()` guards in `validateCustomTotal()` |
| `src/api/expenses.js` | Accept multiple payers in form; change `paidBy` to map; create `LEDGER_ENTRY` events via net-based algorithm |
| `src/api/balances.js` | Keep `get` and `settlements` handlers (they read `state.balances` which is now ledger-derived) |
| `src/views/expense-form.html.hx.js` | Redesign form: replace single `paidBy` dropdown with per-member paid amount inputs |
| `sw.js` | Ensure no new cache entries needed (same file structure) |

---

## Acceptance Criteria

- [ ] `LEDGER_ENTRY` event type exists and is used for all financial transfers
- [ ] `EXPENSE_ADDED` `paidBy` is a map `{ [userId]: amount }` supporting multiple payers
- [ ] Single-payer expenses still work (converted to `{ [userId]: total }` internally)
- [ ] `projectState()` computes balances solely from `LEDGER_ENTRY` events
- [ ] Adding an expense with multiple payers generates correct net-based `LEDGER_ENTRY` events
- [ ] All cents are assigned — sum of all `LEDGER_ENTRY` amounts for an expense equals total
- [ ] `validateCustomTotal()` properly rounds to cents before comparison
- [ ] All split strategies (equal, shares, custom) work with multiple payers
- [ ] Expense form has per-member paid amount inputs, with sum validation
- [ ] Existing views still render correctly (balances display same as before)
- [ ] Old `PAYMENT_MADE` events (if any) are handled gracefully or ignored
- [ ] Edge cases handled: single payer, all members pay, one person pays and doesn't participate, split includes payers

---

## E2E Tests

Add the following test scenarios to `tests/e2e/scenarios.spec.js` (or a new `tests/e2e/double-entry.spec.js`):

### Test: Single payer expense (regression)
1. Create a group with 3 members
2. Add expense: €30, paid by Alice, split equal
3. Verify: expense appears, balance shows Alice is owed €20, Bob owes €10, Charlie owes €10

### Test: Multiple payers, equal split
1. Create a group with 3 members (Alice, Bob, Charlie)
2. Add expense: €30, Alice paid €20, Bob paid €10, split equal among all 3
3. Verify: Charlie owes €10, Alice is owed €10, Bob is at €0

### Test: Multiple payers with penny distribution
1. Create a group with 3 members (Alice, Bob, Charlie)
2. Add expense: €10.00, Alice paid €6.00, Bob paid €4.00, split equal among all 3
3. Verify: balances show correct cent-level allocation (Alice ~+€2.67, Bob ~+€0.67, Charlie ~-€3.33)

### Test: Multiple payers, shares strategy
1. Create a group with 3 members (Alice, Bob, Charlie)
2. Add expense: €90, Alice paid €60, Bob paid €30, split by shares (Alice:2, Bob:1, Charlie:1)
3. Verify: correct net balances after proportional distribution

### Test: Multiple payers, custom split
1. Create a group with 2 members (Alice, Bob)
2. Add expense: €50, Alice paid €30, Bob paid €20, custom split: Alice €20, Bob €30
3. Verify: Alice is owed €10, Bob owes €10

### Test: All members paid (everyone chips in)
1. Create a group with 3 members (Alice, Bob, Charlie)
2. Add expense: €30, Alice paid €10, Bob paid €10, Charlie paid €10, split equal among all 3
3. Verify: all balances at €0 (everyone paid their exact share)

### Test: One person pays but doesn't participate in split
1. Create a group with 3 members (Alice, Bob, Charlie)
2. Add expense: €20, Alice paid €20, split: Bob €10, Charlie €10 (Alice not in split)
3. Verify: Alice is owed €20, Bob owes €10, Charlie owes €10

### Test: Form validation — sum of paid amounts must equal total
1. Open the expense form
2. Enter €30 total, enter Alice paid €20 and Bob paid €5 (sums to €25, not €30)
3. Verify: form shows validation error, expense not created

### Test: Penny distribution with 3-way equal split
1. Create a group with 3 members
2. Add expense: €10, paid by Alice, split equal
3. Verify: balances show Alice +€6.67, Bob -€3.33, Charlie -€3.34 (or vice versa — pennies distributed correctly)

---

## Dependencies

- Supersedes task 04 (split engine) and parts of task 03 (event sourcing) and task 09 (expenses API)
- Must be done **before** task 24 (global users) if users become global entities referenced by ledger entries
- Must be done **before** task 25 (settlements) since settlements create `LEDGER_ENTRY` events
