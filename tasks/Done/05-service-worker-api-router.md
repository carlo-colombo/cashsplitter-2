# Implement Service Worker API router

**Priority:** high
**Depends on:** 1 (scaffold)
**Status:** TODO

## Description

Create `src/api/router.js` — maps URL patterns to handler functions for the SW to dispatch.

## Tasks

- [ ] Define route table using `URLPattern` API:
  - `GET /api/groups` → `groups.list`
  - `POST /api/groups` → `groups.create`
  - `GET /api/groups/:id` → `groups.detail`
  - `POST /api/groups/:id/members` → `members.add`
  - `POST /api/groups/:id/expenses` → `expenses.add`
  - `GET /api/groups/:id/balances` → `balances.get`
  - `GET /api/groups/:id/settlements` → `balances.settlements`
- [ ] Implement `handleRequest(request)` that:
  - Strips origin, matches against routes
  - Calls matched handler with `(params, request)`
  - Returns a `Response` object (HTML or redirect)
  - Returns 404 if no match
- [ ] Export `handleRequest` for use in `sw.js`

## Acceptance criteria

- Router correctly matches all defined URL patterns
- Returns proper `Response` objects with status codes
- Unmatched routes return 404
