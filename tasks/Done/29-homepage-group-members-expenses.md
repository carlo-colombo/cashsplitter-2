# 29 — Show group members and expenses on the homepage

## Description

The homepage (groups list) currently only shows each group's name and a delete button. This task enhances each group card to display:
- The **member names** in the group
- The **total expense count and total amount** in euros

This gives users a quick overview of each group without having to enter it.

## Acceptance criteria

1. Each group card on the homepage displays the **names of its members** below the group name (e.g. "Carlo, Fra, Diego")
2. Each group card also displays the **number of expenses and total amount** (e.g. "5 expenses · €150.00 total")
3. If a group has no members yet, show "No members" or similar empty state
4. If a group has no expenses yet, show "No expenses" or similar empty state
5. The existing "Create Group" form and delete buttons continue to work unchanged
6. The empty state ("No groups yet...") remains unchanged when there are no groups

## Implementation details

### File: `src/api/groups.js` — modify `list()` handler

Currently `list()` only passes `{ id, name }` per group. It needs to also compute:

- **Members**: Look up `state.groupMembers[groupId]` (which has `userName`) or resolve `state.members[groupId]` via `state.users` to get display names. Join them into a comma-separated string or pass an array to the template.
- **Expenses**: Look up `state.expenses[groupId]` → compute `count` and `total` (sum of all expense `total` fields). Total should be in cents (divide by 100 for display).

Pass these as additional fields on each group object in the list data.

### File: `src/views/groups-list.html.hx` — modify template

Update the `{{#each groups}}` block in the group card to render:
- A line showing member names (e.g. `<span class="group-members">Members: Carlo, Fra, Diego</span>`)
- A line showing expense summary (e.g. `<span class="group-expenses">5 expenses · €150.00 total</span>`)

Use the same `(total / 100).toFixed(2)` formatting pattern used elsewhere in the codebase.

### Formatting

- Amounts are stored in cents (integers), divide by 100 and format with 2 decimal places (e.g. `(total / 100).toFixed(2)`)
- Use the euro sign (€) for currency display
- Empty states: "No members", "No expenses"

## Dependencies

All prior tasks are complete (the project is fully scaffolded and functional).
