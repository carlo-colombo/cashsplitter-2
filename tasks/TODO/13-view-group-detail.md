# Create group detail view (HTML fragment)

**Priority:** high
**Depends on:** 7 (groups handler), 8 (members handler), 9 (expenses handler), 10 (balances handler)
**Status:** TODO

## Description

Create `src/views/group-detail.html.hx` — the group detail page showing members, expenses, and balance summary.

## Tasks

- [ ] Group header: name, member count
- [ ] **Members section**: list of member names with "Add Member" button
  - "Add Member" expands inline form (`hx-post="/api/groups/:id/members"`)
- [ ] **Expenses section**: list of expenses (description, total, who paid, how split)
  - Each expense row shows: description, amount, paid by, split summary
  - "Add Expense" button loads expense form
- [ ] **Balance summary section**: net balance for each person
  - Quick snapshot (full details link to `/api/groups/:id/balances`)
- [ ] Action buttons: "Add Member", "Add Expense", "View Settlements"
- [ ] Layout: mobile-first stacked sections with cards

## Acceptance criteria

- Group detail shows all relevant info on one page
- Adding a member updates the member list inline
- Adding an expense updates the expense list and balances
- Works as an HTMX-swappable fragment
