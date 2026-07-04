# Implement IndexedDB event store

**Priority:** high
**Depends on:** 1 (scaffold)
**Status:** TODO

## Description

Create `src/db/store.js` — a thin wrapper around IndexedDB for storing immutable events.

## Tasks

- [ ] Open `cashsplitter` IndexedDB database with an `events` object store
- [ ] Implement `addEvent(event)` — appends an event with auto-generated `id` and `timestamp`
- [ ] Implement `getAllEvents()` — returns all events ordered by timestamp
- [ ] Implement `getEventsByGroup(groupId)` — filters events for a given group
- [ ] Ensure all operations return Promises for use in the Service Worker

## Acceptance criteria

- Events can be written to and read from IndexedDB
- Each event has `id` (UUID), `type`, `data`, `timestamp`
- All functions are async/Promise-based
