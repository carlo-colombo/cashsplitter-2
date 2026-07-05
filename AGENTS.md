# CashSplitter — Agent Guide

## Overview

CashSplitter is a **mobile-first PWA** for splitting expenses among friends, relatives, or travel groups. It uses an unusual architecture:

```
HTMX (browser) → fetch('/api/...') → Service Worker → IndexedDB
                                        ↕
                                  Event store
                              (append-only log)
```

There is **no backend server**. The Service Worker acts as the API layer — it intercepts HTMX requests, reads/writes IndexedDB, and returns HTML fragments. The SW also caches static assets for offline use.

All data is stored as **immutable events** (event sourcing). Current state is derived by replaying events.

---

## CI Pipeline

This project uses GitHub Actions (`.github/workflows/deploy.yml`) with 3 sequential jobs:

| Job | Description |
|-----|-------------|
| `test` | Runs `npm test` (Playwright E2E + unit tests) |
| `deploy` | Deploys to GitHub Pages (only if test passes) |
| `smoke-test-deployed` | Runs E2E against the live deployed site |

### Checking pipeline status

Use `gh` to check the latest run status:

```bash
# List recent runs
gh run list --repo carlo-colombo/cashsplitter-2 --limit 5

# Watch a specific run in real-time
gh run watch <run-id> --repo carlo-colombo/cashsplitter-2

# View job details for a run
gh run view <run-id> --repo carlo-colombo/cashsplitter-2 --json jobs

# View logs for a failed job
gh run view <run-id> --repo carlo-colombo/cashsplitter-2 --log-failed
```

---

## Task Management

Tasks live in the `tasks/` directory:

| Directory   | Purpose                           |
|-------------|-----------------------------------|
| `tasks/TODO/` | Tasks not yet started          |
| `tasks/in-progress/` | Currently being worked on |
| `tasks/Done/` | Completed tasks             |

### Instructions for agents

1. **Start a task**: Move the task file from `tasks/TODO/` to `tasks/in-progress/`.
2. **Work the task**: Implement the code for that task.
3. **Demo after each task**: After completing a task, demonstrate the change to the user before moving to the next one. Show what was built, how it works, and confirm it meets expectations.
4. **Complete a task**: Once the demo is approved, move the file from `tasks/in-progress/` to `tasks/Done/`.
5. **Pick next task**: Only start a new task when the previous one is in `tasks/Done/`. Respect the **dependency order** (see plan below) — a task should not be started until all its dependencies are in `tasks/Done/`.
6. If a task turns out to be larger than expected, split it into subtasks and create new ticket files in `tasks/TODO/`.
7. If priorities change, update the task files accordingly.

---

## Plan & Task Dependencies

```
01-scaffold ───────────────────────────────┐
                                           │
02-event-store ──→ 03-event-engine ──┐     │
                                     │     │
04-split-engine ─────────────────────┤     │
                                     │     │
05-api-router ───→ 06-sw-core ───────┤     │
                                     │     │
                         ┌───────────┘     │
                         ▼                 ▼
                 07-groups-handler    11-shell-page
                 08-members-handler   12-groups-list-view
                 09-expenses-handler  13-group-detail-view
                 10-balances-handler  14-expense-form-view
                                      15-member-form-view
                                      16-settlements-view
                                      17-mobile-first-css
                                      18-pwa-manifest
                                       │
                                       ▼
                                 19-playwright-tests
                                       │
                                       ▼
                                 20-github-actions-deploy
```

### Ticket summary

| # | File | What it does |
|---|------|-------------|
| 01 | `01-project-scaffold.md` | Create dirs, `package.json`, `.gitignore` |
| 02 | `02-indexeddb-event-store.md` | `src/db/store.js` — IndexedDB wrapper |
| 03 | `03-event-sourcing-engine.md` | `src/db/events.js` — replay events → state |
| 04 | `04-split-calculation-engine.md` | `src/lib/split.js` — equal, shares, custom |
| 05 | `05-service-worker-api-router.md` | `src/api/router.js` — URL routing |
| 06 | `06-service-worker-core.md` | `sw.js` — install, cache, fetch dispatch |
| 07 | `07-api-handler-groups.md` | `src/api/groups.js` — list/create groups |
| 08 | `08-api-handler-members.md` | `src/api/members.js` — add members |
| 09 | `09-api-handler-expenses.md` | `src/api/expenses.js` — add expenses |
| 10 | `10-api-handler-balances.md` | `src/api/balances.js` — balances + settlements |
| 11 | `11-html-shell-page.md` | `index.html` — app shell |
| 12 | `12-view-groups-list.md` | `groups-list.html.hx` fragment |
| 13 | `13-view-group-detail.md` | `group-detail.html.hx` fragment |
| 14 | `14-view-expense-form.md` | `expense-form.html.hx` fragment |
| 15 | `15-view-member-form.md` | `member-form.html.hx` fragment |
| 16 | `16-view-settlements.md` | `settlements.html.hx` fragment |
| 17 | `17-mobile-first-css.md` | `styles/app.css` |
| 18 | `18-pwa-manifest-and-icons.md` | `manifest.json`, icons |
| 19 | `19-playwright-e2e-tests.md` | `tests/e2e/` — test scenarios |
| 20 | `20-github-actions-deploy.md` | `.github/workflows/deploy.yml` |

---

## Architecture Decisions

### Split strategies
- **Equal**: total ÷ n participants
- **Shares (ratios)**: e.g. `{Carlo: 2, Fra: 1, Diego: 1}` → proportional split
- **Custom**: explicit amounts per person (must sum to total)

### Views are HTML templates
The SW returns **HTML strings** (not JSON). HTMX swaps these into the DOM.

HTML fragments are **not** built via string concatenation. Instead, the `.html.hx` files in `src/views/` are real template files containing `{{placeholder}}` syntax. A `src/lib/template.js` module provides a `render(template, data)` function that:
- Replaces `{{key}}` with values from the data object
- Supports `{{#each items}}...{{/each}}` for loops
- Supports `{{#if condition}}...{{/if}}` for conditionals

The SW loads these template files at install time (cached), and API handlers call `render(templateName, data)` to produce responses. No manual HTML string concatenation anywhere.

### Settlements
Default view shows raw balances (who owes whom what). A toggle switches to **optimized settlements** (minimal number of transactions, computed via greedy match).

### Home page
The groups list is the home page. Empty state shows "No groups yet — create one".

---

## File structure (expected at completion)

```
cashsplitter/
├── index.html
├── manifest.json
├── sw.js
├── AGENTS.md
├── tasks/
│   ├── TODO/
│   ├── in-progress/
│   └── Done/
├── src/
│   ├── api/
│   │   ├── router.js
│   │   ├── groups.js
│   │   ├── members.js
│   │   ├── expenses.js
│   │   └── balances.js
│   ├── db/
│   │   ├── store.js
│   │   └── events.js
│   ├── lib/
│   │   ├── split.js
│   │   └── template.js
│   └── views/
│       ├── groups-list.html.hx
│       ├── group-detail.html.hx
│       ├── expense-form.html.hx
│       ├── member-form.html.hx
│       └── settlements.html.hx
├── styles/
│   └── app.css
├── tests/
│   └── e2e/
│       ├── playwright.config.js
│       └── scenarios.spec.js
├── .github/
│   └── workflows/
│       └── deploy.yml
└── package.json
```
