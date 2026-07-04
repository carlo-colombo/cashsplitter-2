# Task 21: Store amounts in cents (integer math)

## Problem
All monetary amounts (totals, split amounts, balances, settlements) are currently stored as floating-point numbers (e.g., `12.34`). Floating-point arithmetic leads to precision errors (e.g., `0.1 + 0.2 !== 0.3`) that cause incorrect balances and settlement calculations over time.

## Solution
Store all monetary values as **integers representing cents** (e.g., `1234` for €12.34). All calculations use integer math. Only convert to euros for display.

## Files to modify

### 1. `src/lib/split.js` — Rewrite with integer math

- `splitEqual(totalCents, participants)`:
  - `totalCents` is an integer (cents)
  - `const raw = Math.floor(totalCents / count)`
  - `const remainder = totalCents % count`
  - First `remainder` participants get `raw + 1`, rest get `raw`
  - Returns `{ [userId]: amountInCents, ... }`
  - No floating point operations, no `roundTo2`

- `splitByShares(totalCents, shares)`:
  - Same approach: integer division, remainder distributed as cents
  - Use `BigInt`-safe integer math if needed (or just regular numbers — cents × participants stays well within `Number.MAX_SAFE_INTEGER` for reasonable values)

- `splitCustom(amounts)`:
  - Amounts are already in cents (integers)
  - Just validate and return as-is

- `validateCustomTotal(amounts, expectedTotalCents)`:
  - Sum of amounts (integers) must equal `expectedTotalCents`

### 2. `src/api/expenses.js` — Convert euros to cents on input

In the `add` handler:
- Read `total` from form, convert: `const totalCents = Math.round(parseFloat(form.get('total')) * 100)`
- Pass `totalCents` to split functions
- Store `total` (in cents) and split amounts (in cents) in the `EXPENSE_ADDED` event

### 3. `src/api/balances.js` — Update thresholds to cents

- `computeSettlements`:
  - Replace `0.01` threshold with `1` (1 cent)
  - Replace `Math.round(net * 100) / 100` — no longer needed, values are already integers
  - Replace `> 0.01` with `> 0` (positive balance means they're owed at least 1 cent)
  - Replace `< -0.01` with `< 0`
  - Replace `< 0.01` with `< 1` (or `<= 0`)

### 4. `src/views/group-detail.html.hx.js` — Display amounts as euros

- `e.total.toFixed(2)` → `(e.total / 100).toFixed(2)`
- `Math.abs(net).toFixed(2)` → `(Math.abs(net) / 100).toFixed(2)`
- `Math.abs(b) > 0.01` → `Math.abs(b) >= 1` (checking if any non-zero balance in cents)

### 5. `src/views/settlements.html.hx.js` — Display amounts as euros

- `s.amount.toFixed(2)` → `(s.amount / 100).toFixed(2)`
- All balance/settlement display values should be divided by 100

### 6. `src/views/expense-form.html.hx.js`

- No changes needed to the form itself (inputs stay in euros)
- But verify the inline `toggleSplitStrategy` script doesn't reference stored amounts

### 7. `src/db/events.js`

- No structural changes needed — events store whatever data is given
- `projectState` balance calculations will naturally be in cents since all inputs are in cents
- Verify: `bal[paidBy] += total` (total is now in cents, OK)
- Verify: `bal[userId] -= amount` (amount is now in cents, OK)

## Testing notes

- Create a group with €10.00 split 3 ways → each pays 333¢, 333¢, 334¢ (not 3.33, 3.33, 3.34)
- Create €0.01 split 2 ways → 1¢ and 0¢
- Verify balances sum to zero (in cents)
- Verify settlements produce exact integer results
