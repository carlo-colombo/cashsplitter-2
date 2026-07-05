# 27 — SW Force Refresh Button

## Description
Add a button in the app header that allows the user to manually force-refresh the Service Worker. This is useful for picking up the latest version of the app when a new SW has been installed but is waiting to activate.

## Changes

### `sw.js`
- Add a `message` event listener that handles `{ type: 'SKIP_WAITING' }` by calling `self.skipWaiting()`.

### `index.html`
- Store the SW registration in a `swRegistration` variable for later use.
- Listen for `updatefound` on the registration to detect when a new SW is being installed, and log when it reaches `installed` state.
- Add a `controllerchange` listener that auto-reloads the page when a new SW takes over (prevents the need for a double reload).
- Add a `↻` button in the app header that calls `forceSWRefresh()`.
- The `forceSWRefresh()` function: calls `registration.update()`, and if a waiting SW exists, posts a `SKIP_WAITING` message to trigger activation. Otherwise falls back to `window.location.reload()`.

### `styles/app.css`
- Make the header a flex container with `justify-content: space-between` to accommodate the button.
- Add `.sw-refresh-btn` styles: circular button with translucent border, hover/focus/active states.
- Add `.sw-refresh-btn.spinning` animation for visual feedback while refreshing.

## Flow
1. User clicks the ↻ button
2. Button gets a spinning animation
3. `registration.update()` checks for a new SW
4. If a waiting SW exists → `SKIP_WAITING` message sent → SW activates → `controllerchange` fires → page auto-reloads with fresh code
5. If no waiting SW → page reloads directly
