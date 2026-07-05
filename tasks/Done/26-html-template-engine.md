# 26 — HTML Template Engine for Views

## Summary

Replace the current **JavaScript string concatenation** approach for building HTML views with a **custom lightweight template engine**. Template files (`.html.hx`) contain pure HTML with `{{placeholder}}` syntax, and a `src/lib/template.js` module renders them with data.

---

## Motivation

Currently, every view function builds HTML via messy string concatenation:

```js
html += '<li class="' + cls + '">' + escapeHtml(name) + ' ' + label + ' €' + (Math.abs(net) / 100).toFixed(2) + '</li>'
```

This is:
- **Hard to read**: HTML structure is obscured by JS concatenation
- **Hard to maintain**: HTML changes require JS edits
- **Error-prone**: Missing escapes cause XSS vulnerabilities
- **Inconsistent**: Each view has its own copy of `escapeHtml()`

Switching to template files with a render engine solves all of these. This is exactly what the original `AGENTS.md` architecture specified (a `src/lib/template.js` with `render(template, data)`), but it was never implemented.

---

## Requirements

### 1. Template Engine (`src/lib/template.js`)

A pure-JS, zero-dependency template engine exporting:

```js
export function render(template, data) → string
```

**Supported syntax:**

| Syntax | Description | Example |
|--------|-------------|---------|
| `{{key}}` | HTML-escaped variable substitution | `{{group.name}}` |
| `{{{key}}}` | Raw (unescaped) substitution for URLs/HTML attributes | `{{{backUrl}}}` |
| `{{#each list}}…{{/each}}` | Loop over an array | `{{#each members}}<li>{{this.name}}</li>{{/each}}` |
| `{{#if condition}}…{{/if}}` | Conditional (truthy check) | `{{#if hasMembers}}…{{/if}}` |
| `{{#if condition}}…{{else}}…{{/if}}` | Conditional with else | `{{#if hasExpenses}}…{{else}}<p>No expenses</p>{{/if}}` |
| `{{! comment }}` | Comment (ignored in output) | `{{! this is a comment }}` |
| `{{this}}` | Current loop item (inside `{{#each}}`) | `{{this}}` |
| `{{this.prop}}` | Property of current loop item | `{{this.name}}` |

**Nested path resolution:** `{{group.name}}` resolves to `data.group.name`. `{{this.name}}` inside an each block resolves to `currentItem.name`.

**Escaping:** All `{{…}}` output is HTML-escaped (`&`, `<`, `>`, `"`). Only `{{{…}}}` is raw.

**Error handling:** If a key is missing, render an empty string (not crash).

### 2. Template Files (`.html.hx`)

Create template files in `src/views/` as pure HTML files with `{{placeholder}}` syntax:

| Template File | Replaces | Purpose |
|---------------|----------|---------|
| `src/views/groups-list.html.hx` | `groups-list.html.hx.js` | Groups list page with create form |
| `src/views/group-detail.html.hx` | `group-detail.html.hx.js` | Full group detail page |
| `src/views/expense-form.html.hx` | `expense-form.html.hx.js` | Expense form with strategy toggles |
| `src/views/member-form.html.hx` | `member-form.html.hx.js` | Simple member name form |
| `src/views/settlements.html.hx` | `settlements.html.hx.js` | Balances + settlements views |

**Keep inline client-side JS in templates** where needed (e.g., the `toggleSplitStrategy()` function in the expense form goes into a `<script>` tag inside the `.html.hx` file).

**Delete** the old `.html.hx.js` files once templates are working.

### 3. Data Pre-processing in Handlers

API handlers currently pass raw data (members, expenses, balances) to view functions. With the template engine, handlers must **pre-process data** into template-friendly shapes before calling `render()`.

This means:
- Compute formatted currency values (`(total / 100).toFixed(2)`) in the handler
- Compute CSS class names and labels (e.g., `positive`/`negative`, `is owed`/`owes`) in the handler
- Compute empty-state booleans (`hasMembers`, `hasExpenses`, `hasBalances`) in the handler
- Convert objects to arrays where iteration is needed (`Object.entries(balances)` → `balanceItems[]`)
- Look up related data (e.g., payer name from member list) in the handler

**Pattern:**

```js
// Handler
const data = {
  group: { id: group.id, name: group.name },
  memberCount: members.length,
  hasMembers: members.length > 0,
  members: members.map(m => ({ id: m.id, name: m.name })),
  expenses: expenses.map(e => ({
    description: e.description,
    totalFormatted: (e.total / 100).toFixed(2),
    payerName: lookupName(members, e.paidBy)
  })),
  balanceItems: Object.entries(balances).map(([userId, net]) => ({
    name: lookupName(members, userId),
    amount: (Math.abs(net) / 100).toFixed(2),
    cls: net >= 0 ? 'positive' : 'negative',
    label: net >= 0 ? 'is owed' : 'owes'
  })),
  hasBalances: Object.values(balances).some(b => Math.abs(b) >= 1)
}
return render(template, data)
```

### 4. Service Worker: Load Templates at Install

Update `sw.js` to:

1. Add all `src/views/*.html.hx` files to the cache on install
2. When a handler needs a template, read it from cache and parse with `render()`
3. OR: Load templates eagerly at install and keep them in memory

**Recommendation:** Load template content into a `Map<name, string>` at SW install time (from cache), so `render()` calls are synchronous and fast.

```js
// sw.js install event
const templateCache = new Map()
async function loadTemplates() {
  const templateNames = ['groups-list', 'group-detail', 'expense-form', 'member-form', 'settlements']
  for (const name of templateNames) {
    const res = await fetch(`/cashsplitter-2/src/views/${name}.html.hx`)
    templateCache.set(name, await res.text())
  }
}
```

Then handlers call:
```js
import { render } from '../lib/template.js'
const html = render(templateCache.get('group-detail'), data)
```

### 5. Handler Updates

Update all API handlers to use `render(templateName, data)` instead of calling view functions:

| Handler | Old call | New call |
|---------|----------|----------|
| `groups.list` | `renderGroupsList(state.groups)` | `render('groups-list', data)` |
| `groups.create` / `groups.detail` | `renderGroupDetail(group, members, expenses, balances)` | `render('group-detail', data)` |
| `members.form` | `renderMemberForm(groupId)` | `render('member-form', data)` |
| `members.add` | `renderGroupDetail(...)` | `render('group-detail', data)` |
| `expenses.form` | `renderExpenseForm(groupId, members)` | `render('expense-form', data)` |
| `expenses.add` | `renderGroupDetail(...)` | `render('group-detail', data)` |
| `balances.get` | `renderBalances(balances, members)` | `render('settlements', data)` with balances section |
| `balances.settlements` | `renderSettlements(settlements, members)` | `render('settlements', data)` with settlements section |

### 6. Remove Old View Files

After everything works, delete:
- `src/views/groups-list.html.hx.js`
- `src/views/group-detail.html.hx.js`
- `src/views/expense-form.html.hx.js`
- `src/views/member-form.html.hx.js`
- `src/views/settlements.html.hx.js`

---

## Files to create/modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/template.js` | **Create** | Template engine with `render(template, data)` |
| `src/views/groups-list.html.hx` | **Create** | Template: groups list |
| `src/views/group-detail.html.hx` | **Create** | Template: group detail |
| `src/views/expense-form.html.hx` | **Create** | Template: expense form (with inline toggle JS) |
| `src/views/member-form.html.hx` | **Create** | Template: member form |
| `src/views/settlements.html.hx` | **Create** | Template: balances + settlements |
| `src/api/groups.js` | **Modify** | Pre-process data, call `render()` |
| `src/api/members.js` | **Modify** | Pre-process data, call `render()` |
| `src/api/expenses.js` | **Modify** | Pre-process data, call `render()` |
| `src/api/balances.js` | **Modify** | Pre-process data, call `render()` |
| `sw.js` | **Modify** | Load `.html.hx` templates at install, expose to handlers |
| `src/views/groups-list.html.hx.js` | **Delete** | Replaced by `.html.hx` template |
| `src/views/group-detail.html.hx.js` | **Delete** | Replaced by `.html.hx` template |
| `src/views/expense-form.html.hx.js` | **Delete** | Replaced by `.html.hx` template |
| `src/views/member-form.html.hx.js` | **Delete** | Replaced by `.html.hx` template |
| `src/views/settlements.html.hx.js` | **Delete** | Replaced by `.html.hx` template |

---

## E2E Tests

All existing E2E tests must still pass after the refactor. The tests verify rendered HTML content, so if the template conversion is correct, no test changes should be needed.

Run the full test suite to validate:

```bash
npx playwright test
```

### Regression test scenarios (add to `tests/e2e/scenarios.spec.js`):

### Test: Groups list renders with template engine
1. Load home page
2. Verify: empty state shows "No groups yet"
3. Create a group
4. Verify: group name appears in list

### Test: Group detail renders correctly
1. Create a group with 2 members
2. Add an expense
3. Verify: member list, expense list, and balance snapshot all render correctly

### Test: Expense form renders with toggle functionality
1. Open expense form
2. Click "By Shares" radio → verify share inputs appear
3. Click "Custom" radio → verify custom amount inputs appear
4. Click "Equal" radio → verify "All members split equally" message

### Test: Balances and settlements render
1. Create a group with members and expenses
2. Click "Balances" → verify balance items render
3. Click "View Settlements" → verify settlement items render

---

## Design Notes

### Why pre-process data in handlers instead of in-template logic?

The template engine is intentionally minimal — no expressions, no arithmetic, no formatting. All computed values (currency format, CSS classes, labels, lookups) are pre-computed in the handler before passing to the template. This:
- Keeps templates readable (pure HTML + simple placeholders)
- Keeps business logic in JS where it belongs
- Makes testing easier (test the data shape, not the template)
- Avoids scope creep in the template engine

### Template file location

Templates live in `src/views/` alongside the old `.js` view files (to be deleted). They are loaded by the SW at install time via `fetch()` and cached in memory.

The `.html.hx` extension distinguishes them from regular HTML and hints at their HTMX-friendly partial-page nature.

---

## Acceptance Criteria

- [ ] `src/lib/template.js` exports `render(template, data)` supporting `{{key}}`, `{{{key}}}`, `{{#each}}`, `{{#if}}`/`{{else}}`, `{{this}}`, `{{! comment }}`
- [ ] Missing keys render as empty string (no crash)
- [ ] All `{{…}}` output is HTML-escaped; `{{{…}}}` is raw
- [ ] All 5 `.html.hx` template files are created and render correctly
- [ ] All API handlers use `render(templateName, data)` instead of old view functions
- [ ] Old `.html.hx.js` files are deleted
- [ ] SW loads templates at install time into an in-memory cache
- [ ] All existing E2E tests pass without modification
- [ ] Inline client-side JS (split strategy toggle) still works in expense form
- [ ] No regressions in any view: groups list, group detail, member form, expense form, balances, settlements

---

## Dependencies

- **Independent of tasks 23-25.** This is a view-layer refactor that can be done before, after, or in parallel with the data model changes.
- **Recommended order: do this task FIRST** (before 23-25) so that subsequent tasks benefit from clean template files instead of messy string concatenation.
- Run all existing E2E tests after completion to confirm no regressions.
