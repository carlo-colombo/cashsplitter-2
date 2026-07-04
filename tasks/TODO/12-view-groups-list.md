# Create groups list view (HTML fragment)

**Priority:** high
**Depends on:** 7 (groups handler)
**Status:** TODO

## Description

Create `src/views/groups-list.html.hx` — the HTML template processed by `src/lib/template.js`.

Use `{{placeholder}}` syntax for dynamic data. The data object passed to `render()` will have:
- `groups` — array of `{ id, name }`
- `empty` — boolean (true when no groups exist)

## Tasks

- [ ] Template uses `{{#each groups}}...{{/each}}` to render the group list
- [ ] Each group links to `/api/groups/{{id}}` (HTMX `hx-get` swap)
- [ ] `{{#if empty}}` block: "No groups yet" message with create button
- [ ] "Create Group" inline form (name input + submit button)
- [ ] Form uses `hx-post="/api/groups"` with `hx-target="closest ul"` or similar swap
- [ ] Styled with CSS classes (mobile-first card layout)
- [ ] **No manual HTML string concatenation** — this is a pure template file

## Acceptance criteria

- Groups are displayed as a list of tappable cards
- Empty state shows when no groups exist
- Create Group form works and adds a new group
- Fragment is valid HTML suitable for HTMX swap
