# Create settlements view (HTML fragment)

**Priority:** medium
**Depends on:** 10 (balances handler)
**Status:** TODO

## Description

Create `src/views/settlements.html.hx` — the settlements template processed by `src/lib/template.js`.

Use `{{placeholder}}` syntax. The data object will have:
- `mode` — `'raw'` or `'optimized'`
- `balances` — array of `{ name, paid, spent, netAmount }` (for raw mode)
- `settlements` — array of `{ from, to, amount }` (for optimized mode)
- `groupId` — string
- `allSettled` — boolean

## Tasks

- [ ] `{{#if allSettled}}` block: "All settled up!" message
- [ ] **Raw balances view** (`{{#if equal mode 'raw'}}`):
  - Table: Member | Paid | Spent | Balance
  - Positive balance green, negative red
- [ ] **Optimized settlements view** (`{{#if equal mode 'optimized'}}`):
  - `{{#each settlements}}` — "{{from}} pays {{to}} ${{amount}}"
  - Minimal number of transactions
- [ ] Toggle button: `hx-get="/api/groups/{{groupId}}/settlements?mode=optimized"` (or raw)
- [ ] Back to group detail link: `/api/groups/{{groupId}}`
- [ ] **No manual HTML string concatenation** — pure template file

## Acceptance criteria

- Raw balances are clearly presented
- Optimized settlements reduce transactions correctly
- Toggle switches between views without full page reload
- Zero-balance state is handled gracefully
