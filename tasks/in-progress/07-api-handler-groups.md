# Implement Groups API handler

**Priority:** high
**Depends on:** 3 (event engine), 5 (router)
**Status:** TODO

## Description

Create `src/api/groups.js` — handlers for group-related API endpoints.

## Tasks

- [ ] `GET /api/groups` — returns HTML list of all groups
  - Read all events, project state, render groups-list fragment
  - Include "Create Group" form
  - Show empty state when no groups exist
- [ ] `POST /api/groups` — creates a new group
  - Parse form data (`name`)
  - Create and store `GROUP_CREATED` event
  - Return `HX-Redirect` to `/api/groups/{newId}` (or swap response)
- [ ] Export handlers for the router

## Acceptance criteria

- Creating a group via POST stores an event and redirects
- GET returns an HTML list of groups with names
- Empty state renders correctly when no groups exist
