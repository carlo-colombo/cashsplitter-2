# Scaffold project structure

**Priority:** high
**Depends on:** none
**Status:** TODO

## Description

Create the basic project skeleton for CashSplitter.

## Tasks

- [ ] Create directory structure:
  - `src/api/` — API handlers
  - `src/db/` — IndexedDB / event store
  - `src/lib/` — utilities
  - `src/views/` — HTML fragment templates
  - `styles/` — CSS
  - `tests/e2e/` — Playwright tests
  - `.github/workflows/` — CI/CD
- [ ] Create `package.json` with `npm init`, add Playwright dev dependency
- [ ] Create `.gitignore` (node_modules, dist, .env)
- [ ] Create root-level `index.html` as a minimal placeholder

## Acceptance criteria

- Directories exist and are ready for code
- `package.json` is valid and installable
- `.gitignore` properly excludes node_modules
