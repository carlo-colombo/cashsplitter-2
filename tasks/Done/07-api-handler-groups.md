# Implement Groups API handler

**Priority:** high
**Depends on:** 3 (event engine), 5 (router)
**Status:** TODO

## Description

Create `src/api/groups.js` — handlers for group-related API endpoints.

## Tasks

- [ ] `GET /api/groups` — returns HTML list of all groups
  - Read all events, project state
  - Call `render('groups-list', { groups })` from `src/lib/template.js` to produce HTML
  - Include "Create Group" form
  - Show empty state when no groups exist
- [ ] `POST /api/groups` — creates a new group
  - Parse form data (`name`)
  - Create and store `GROUP_CREATED` event
  - Return `HX-Redirect` to `/api/groups/{newId}` (or swap response)
- [ ] Export handlers for the router

## Acceptance criteria

- Creating a group via POST stores an event and redirects
- GET returns an HTML list of groups with names (via template render, not string concat)
- Empty state renders correctly when no groups exist
