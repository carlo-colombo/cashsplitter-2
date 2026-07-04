# Create member form view (HTML fragment)

**Priority:** medium
**Depends on:** 8 (members handler)
**Status:** TODO

## Description

Create `src/views/member-form.html.hx` — a simple inline form for adding members to a group.

## Tasks

- [ ] Single field: member name (text input, required)
- [ ] Submit button with `hx-post="/api/groups/:id/members"`
- [ ] Validation: name is not empty, no duplicate names in group
- [ ] Error message display (e.g. "Member already exists")
- [ ] Cancel/close button to hide the form
- [ ] After successful submission, form is replaced with updated member list

## Acceptance criteria

- Adding a member with a valid name works
- Duplicate names show an error
- Empty name shows an error
- Form is lightweight and inline (not a separate page)
