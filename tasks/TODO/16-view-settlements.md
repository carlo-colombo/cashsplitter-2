# Create settlements view (HTML fragment)

**Priority:** medium
**Depends on:** 10 (balances handler)
**Status:** TODO

## Description

Create `src/views/settlements.html.hx` — view showing both raw balances and optimized settlements with a toggle.

## Tasks

- [ ] **Raw balances view** (default):
  - Table: Member | Paid | Spent | Balance
  - Positive balance = is owed money (green)
  - Negative balance = owes money (red)
- [ ] **Optimized settlements view**:
  - List of "X pays Y $Z" instructions
  - Minimal number of transactions
- [ ] Toggle button/switch between the two views using HTMX:
  - Button uses `hx-get="/api/groups/:id/settlements"` with `hx-swap="outerHTML"`
  - Or separate endpoints with HTMX swap
- [ ] "All settled up!" empty state when everyone is at zero
- [ ] Back to group detail link

## Acceptance criteria

- Raw balances are clearly presented
- Optimized settlements reduce transactions correctly
- Toggle switches between views without full page reload
- Zero-balance state is handled gracefully
