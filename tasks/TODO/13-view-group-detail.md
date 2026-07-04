# Create group detail view (HTML fragment)

**Priority:** high
**Depends on:** 7 (groups handler), 8 (members handler), 9 (expenses handler), 10 (balances handler)
**Status:** TODO

## Description

Create `src/views/group-detail.html.hx` — the group detail template processed by `src/lib/template.js`.

Use `{{placeholder}}` syntax. The data object passed to `render()` will have:
- `group` — `{ id, name }`
- `members` — array of `{ id, name }`
- `expenses` — array of `{ description, total, paidBy, splitSummary }`
- `balances` — array of `{ name, netAmount }`

## Tasks

- [ ] `{{#if group}}` block: group header with name and member count
- [ ] **Members section**: `{{#each members}}` to list members, plus "Add Member" button
  - "Add Member" expands inline form (`hx-post="/api/groups/{{group.id}}/members"`)
- [ ] **Expenses section**: `{{#each expenses}}` — description, total, who paid, split summary
  - "Add Expense" button loads expense form
- [ ] **Balance summary section**: `{{#each balances}}` — net per person
  - Link to `/api/groups/{{group.id}}/balances` for full details
- [ ] Action buttons: "Add Member", "Add Expense", "View Settlements"
- [ ] Layout: mobile-first stacked sections with cards
- [ ] **No manual HTML string concatenation** — pure template file

## Acceptance criteria

- Group detail shows all relevant info on one page
- Adding a member updates the member list inline
- Adding an expense updates the expense list and balances
- Works as an HTMX-swappable fragment
