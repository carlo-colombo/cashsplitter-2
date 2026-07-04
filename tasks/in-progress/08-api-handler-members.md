# Implement Members API handler

**Priority:** high
**Depends on:** 3 (event engine), 5 (router)
**Status:** TODO

## Description

Create `src/api/members.js` — handlers for adding members to a group.

## Tasks

- [ ] `POST /api/groups/:id/members` — adds a member to a group
  - Parse form data (`name`)
  - Validate that group exists
  - Create and store `MEMBER_ADDED` event
  - Return updated group detail HTML (or redirect)
- [ ] Validate: member name is required, not empty, no duplicates within group

## Acceptance criteria

- Adding a member stores an event linked to the group
- Duplicate member names in the same group are rejected
- Group detail view updates to include the new member
