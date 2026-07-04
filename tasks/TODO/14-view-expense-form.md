# Create expense form view (HTML fragment)

**Priority:** high
**Depends on:** 9 (expenses handler)
**Status:** TODO

## Description

Create `src/views/expense-form.html.hx` — the expense form template processed by `src/lib/template.js`.

Use `{{placeholder}}` syntax. The data object will have:
- `groupId` — string
- `members` — array of `{ id, name }` (for payer/participant selection)
- `errors` — optional object with field error messages

## Tasks

- [ ] Form fields (with `{{#if errors.description}}` for inline errors):
  - Description (text input)
  - Total amount (number input, step 0.01)
  - Paid by: dropdown/radio selecting the member who paid (`{{#each members}}`)
  - Split strategy: radio buttons for "Equal", "By Shares", "Custom"
  - Conditionally show strategy-specific inputs:
    - **Shares**: per-member ratio inputs (default 1), e.g. Carlo: 2, Fra: 1, Diego: 1
    - **Custom**: per-member amount inputs that must sum to total
- [ ] Client-side validation: total matches split amounts for custom strategy
- [ ] Submit uses `hx-post="/api/groups/{{groupId}}/expenses"`
- [ ] Clear error display for invalid submissions
- [ ] Cancel button returns to group detail
- [ ] **No manual HTML string concatenation** — pure template file

## Acceptance criteria

- All three split strategies are selectable
- Strategy-specific inputs appear/disappear based on selection
- Form submits and creates expense, redirecting back to group detail
- Validation errors are shown inline
