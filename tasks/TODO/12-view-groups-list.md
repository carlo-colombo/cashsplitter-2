# Create groups list view (HTML fragment)

**Priority:** high
**Depends on:** 7 (groups handler)
**Status:** TODO

## Description

Create `src/views/groups-list.html.hx` — the HTML fragment returned by the groups handler for the groups listing.

## Tasks

- [ ] Render a list of groups as cards/rows with group name and link to detail
- [ ] Each group links to `/api/groups/{id}` (HTMX `hx-get` swap)
- [ ] Empty state: "No groups yet" message with a create button
- [ ] "Create Group" inline form (name input + submit button)
- [ ] Form uses `hx-post="/api/groups"` with `hx-target="closest ul"` or similar swap
- [ ] Styled with CSS classes (mobile-first card layout)

## Acceptance criteria

- Groups are displayed as a list of tappable cards
- Empty state shows when no groups exist
- Create Group form works and adds a new group
- Fragment is valid HTML suitable for HTMX swap
