# Implement event sourcing replay engine

**Priority:** high
**Depends on:** 2 (event store)
**Status:** TODO

## Description

Create `src/db/events.js` — defines event types and projects current state from the event log.

## Tasks

- [ ] Define event type constants:
  - `GROUP_CREATED`
  - `MEMBER_ADDED`
  - `EXPENSE_ADDED`
  - `PAYMENT_MADE`
- [ ] Implement `projectState(events)` — reduce all events into a single state object:
  - `groups: { [id]: { id, name, created } }`
  - `members: { [groupId]: [{ id, name }] }`
  - `expenses: { [groupId]: [{ id, description, total, paidBy, split }] }`
  - `payments: { [groupId]: [{ id, from, to, amount }] }`
  - `balances: { [groupId]: { [userId]: netAmount } }`
- [ ] Implement `createEvent(type, data)` — factory returning a fully-formed event object

## Acceptance criteria

- Given a list of events, `projectState` returns correct derived state
- Balances are correctly computed (positive = is owed money, negative = owes money)
- No mutation of input data (pure functions)
