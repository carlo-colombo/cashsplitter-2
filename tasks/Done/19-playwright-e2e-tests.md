# Write Playwright e2e tests

**Priority:** high
**Depends on:** all implementation tasks
**Status:** TODO

## Description

Create Playwright end-to-end tests covering the full user flows.

## Tasks

- [ ] Install Playwright: `npx playwright install`
- [ ] Create `tests/e2e/playwright.config.js`:
  - Configure for static file serving (no server needed, serve `index.html` directly)
  - Or use `webServer` to serve the app directory
- [ ] Test scenarios in `tests/e2e/scenarios.spec.js`:
  1. **Create group**: navigate → fill group name → submit → see group in list
  2. **Add members**: click group → add members → verify they appear
  3. **Add equal-split expense**: add expense with equal split → verify balances
  4. **Add shares/ratio expense**: add expense with ratio split → verify per-person amounts
  5. **Add custom-split expense**: add expense with custom amounts → verify correctness
  6. **View balances**: check raw balances display correctly
  7. **Toggle settlements**: switch to optimized settlements → verify fewer transactions
  8. **PWA**: verify manifest, SW registration (optional)
  9. **Empty states**: verify empty group list, empty group detail messages
  10. **Validation**: verify error messages for invalid inputs (empty name, negative amounts)

## Acceptance criteria

- All tests pass consistently
- Tests run in headless Chromium at minimum
- Tests are isolated (each creates own data)
- Tests run in CI via GitHub Actions
