# Create shell HTML page

**Priority:** high
**Depends on:** 6 (SW core), 12 (groups view)
**Status:** TODO

## Description

Create `index.html` — the main application shell that loads HTMX, registers the Service Worker, and acts as the single-page entry point.

## Tasks

- [ ] Standard HTML5 boilerplate with `<meta name="viewport">` for mobile
- [ ] Load HTMX from CDN (or bundle locally)
- [ ] `<link rel="manifest" href="/manifest.json">`
- [ ] Service Worker registration script (inline or `/sw.js`)
- [ ] `<main hx-get="/api/groups" hx-trigger="load" hx-target="this">` — auto-loads groups list on page load
- [ ] Add app header/title "CashSplitter"
- [ ] Basic `<noscript>` fallback message
- [ ] Meta tags for PWA (theme-color, apple-mobile-web-app-capable)

## Acceptance criteria

- Page loads and instantly shows groups list (or empty state)
- HTMX is loaded and working
- Service Worker is registered successfully
- Mobile viewport meta is present
- PWA meta tags are correct
