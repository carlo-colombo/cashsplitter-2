# Create member form view (HTML fragment)

**Priority:** medium
**Depends on:** 8 (members handler)
**Status:** TODO

## Description

Create `src/views/member-form.html.hx` — the member form template processed by `src/lib/template.js`.

Use `{{placeholder}}` syntax. The data object will have:
- `groupId` — string
- `errors` — optional object with field error messages

## Tasks

- [ ] Single field: member name (text input, required)
- [ ] `{{#if errors.name}}` for inline error display
- [ ] Submit button with `hx-post="/api/groups/{{groupId}}/members"`
- [ ] Cancel/close button to hide the form
- [ ] After successful submission, form is replaced with updated member list
- [ ] **No manual HTML string concatenation** — pure template file

## Acceptance criteria

- Adding a member with a valid name works
- Duplicate names show an error
- Empty name shows an error
- Form is lightweight and inline (not a separate page)
