# Create PWA manifest and icons

**Priority:** medium
**Depends on:** 11 (shell page)
**Status:** TODO

## Description

Create `manifest.json` and generate app icons for PWA installability.

## Tasks

- [ ] Create `manifest.json`:
  - `name`: "CashSplitter"
  - `short_name`: "CashSplitter"
  - `start_url`: `/`
  - `display`: `standalone`
  - `background_color` and `theme_color`
  - `icons`: array with 192x192 and 512x512 resolutions
- [ ] Generate or create SVG/PNG icons:
  - Simple cash/coin icon
  - Sizes: 192x192, 512x512
  - Placeholder: a simple SVG with a dollar/ euro sign or coins
- [ ] Link manifest in `index.html`
- [ ] Add `apple-touch-icon` meta tag in `index.html`

## Acceptance criteria

- Lighthouse PWA audit shows installable (or close to it)
- Manifest is valid JSON
- Icons display correctly when installing on mobile
- App opens in standalone mode when installed
