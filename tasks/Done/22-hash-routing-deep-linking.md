# Task 22: Hash-based routing and deep linking

## Problem
GitHub Pages cannot serve custom URLs — it only serves static files. When a user refreshes on a page like `/api/groups/abc-123`, GitHub Pages returns a 404 because no such file exists. The app needs **client-side routing using URL hashes** (`#`) so that:

1. GitHub Pages always serves `index.html` (the hash is never sent to the server)
2. Deep linking works: visiting `/#/groups/abc-123` loads the correct group
3. Browser back/forward navigation works correctly
4. Page refresh on any route loads the app shell and navigates to the right view

## Solution

Implement hash-based client-side routing. All in-app navigation pushes hash URLs. A lightweight JS router in `index.html` interprets hash changes and triggers the appropriate HTMX API calls.

## Files to modify/create

### 1. `index.html` — Add hash router script

Add a `<script>` block (inline, no extra dependencies) that:

- On `DOMContentLoaded`:
  - Read `window.location.hash`
  - Call `navigateTo(hash)` to load the correct view

- On `hashchange`:
  - Call `navigateTo(hash)` to load the correct view

- The `navigateTo(hash)` function:
  - If hash is empty or `#/` → fetch `/api/groups` and swap into `#main-content`
  - If hash matches `#/groups/<id>` → fetch `/api/groups/<id>` and swap into `#main-content`
  - If hash is unknown → fetch `/api/groups` (default to home)

Implementation details:
```js
function navigateTo(hash) {
  const path = hash.replace(/^#/, '') || '/'
  let url
  if (path === '/' || path === '') {
    url = '/api/groups'
  } else {
    const match = path.match(/^\/groups\/(.+)$/)
    if (match) {
      url = `/api/groups/${encodeURIComponent(match[1])}`
    } else {
      url = '/api/groups' // fallback to home
    }
  }
  // Use HTMX's internal ajax mechanism or plain fetch
  htmx.ajax('GET', url, { target: '#main-content', swap: 'innerHTML' })
}
```

### 2. Update `hx-push-url` in all views to use hash URLs

All HTMX push URLs should use `#` prefix instead of `/api/`:

- **`src/views/groups-list.html.hx.js`**:
  - Group link: `hx-push-url="true"` → `hx-push-url="/#/groups/${escapeHtml(id)}"`
  - The `hx-get` remains `/api/groups/${id}` (API calls stay the same)

- **`src/views/group-detail.html.hx.js`**:
  - Back link: `hx-push-url="true"` → `hx-push-url="/#/"`
  - The `hx-get` remains `/api/groups`

- **`src/api/groups.js`** (server-side):
  - `HX-Push-Url` response header: `/api/groups/${id}` → `/#/groups/${id}`

### 3. Create `404.html` — GitHub Pages SPA fallback

Create `404.html` as a copy of `index.html`. GitHub Pages serves `404.html` for any 404 response, which gives the SPA a chance to boot up and parse the URL.

However, with hash routing this is less critical (the hash is never sent to the server). Still create it as a safety net for users who might navigate to a non-hash URL.

### 4. `src/views/group-detail.html.hx.js` — Update header actions

The group detail view has buttons that load forms/members/balances. Their `hx-get` URLs stay as `/api/...` (they're API calls, not navigation). No change needed for these.

However, consider whether any of these should update the hash URL. For example, clicking "Balances" might want to push `/#/groups/:id/balances`. For now, keep it simple — only the main navigation (home, group detail) updates the URL hash.

### 5. Verify SW navigation handling

The SW (`sw.js`) already serves `index.html` for navigation requests (see `isNavigationRequest` branch). This is correct. When the user refreshes on any URL:
1. SW intercepts the navigation request
2. Returns cached `index.html`
3. `index.html` loads, reads the hash, navigates to the right view

No SW changes needed, but verify the logic works end-to-end:
- First visit to `https://user.github.io/cashsplitter/` → loads `index.html` → SW installs → navigates to home
- Visit `https://user.github.io/cashsplitter/#/groups/abc` → loads `index.html` → SW serves from cache → hash router navigates to group
- Refresh on `https://user.github.io/cashsplitter/#/groups/abc` → SW serves cached `index.html` → hash router navigates to group

## Testing notes

- Test all navigation paths work with hash URLs
- Test browser back/forward buttons
- Test page refresh on every route
- Test first visit (no SW installed) — should still work
- Test the `404.html` fallback on GitHub Pages (or locally by simulating a 404)
