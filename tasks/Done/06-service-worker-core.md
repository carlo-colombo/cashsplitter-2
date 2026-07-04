# Implement Service Worker core

**Priority:** high
**Depends on:** 5 (router)
**Status:** TODO

## Description

Create `sw.js` — the Service Worker entry point. Handles install, activate, and fetch events.

## Tasks

- [ ] **Install event**: Pre-cache all static assets (`/`, `/styles/*`, `/src/*`, `/manifest.json`)
- [ ] **Activate event**: Clean old caches, claim clients immediately
- [ ] **Fetch event**:
  1. Try API router (`import('./src/api/router.js')`)
  2. If router returns a response → return it
  3. Else try cache match
  4. Else try network (shouldn't happen for static assets but fallback)
  5. Return offline fallback HTML if nothing works
- [ ] Support `importScripts` or ES module imports for the router and handlers
- [ ] Log registration success to console

## Acceptance criteria

- SW installs and activates successfully
- Static assets are served from cache on repeat visits
- API routes are handled without hitting the network
- Offline fallback works when cache miss occurs
