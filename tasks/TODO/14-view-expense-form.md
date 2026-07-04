# Create expense form view (HTML fragment)

**Priority:** high
**Depends on:** 9 (expenses handler)
**Status:** TODO

## Description

Create `src/views/expense-form.html.hx` — the expense creation form with split strategy selection.

## Tasks

- [ ] Form fields:
  - Description (text input)
  - Total amount (number input, step 0.01)
  - Paid by: dropdown/radio selecting the member who paid (option to split payment across multiple payers)
  - Split strategy: radio buttons for "Equal", "By Shares", "Custom"
  - Conditionally show strategy-specific inputs:
    - **Shares**: per-member ratio inputs (default 1), e.g. Carlo: 2, Fra: 1, Diego: 1
    - **Custom**: per-member amount inputs that must sum to total
- [ ] Client-side validation: total matches split amounts for custom strategy
- [ ] Submit uses `hx-post="/api/groups/:id/expenses"`
- [ ] Clear error display for invalid submissions
- [ ] Cancel button returns to group detail

## Acceptance criteria

- All three split strategies are selectable
- Strategy-specific inputs appear/disappear based on selection
- Form submits and creates expense, redirecting back to group detail
- Validation errors are shown inline
