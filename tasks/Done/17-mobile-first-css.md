# Implement mobile-first CSS

**Priority:** high
**Depends on:** 11 (shell page)
**Status:** TODO

## Description

Create `styles/app.css` — a clean, mobile-first stylesheet for the entire app. No CSS framework — just custom CSS.

## Tasks

- [ ] CSS reset / normalize basics
- [ ] Mobile-first responsive design (min-width breakpoints for tablets/desktop)
- [ ] Card-based layout for groups, expenses, members
- [ ] Form styling: inputs, buttons, selects — large touch targets (min 44px)
- [ ] Color scheme: clean, readable (maybe a subtle green accent for money)
- [ ] Balance visualization: positive balances green, negative red
- [ ] Header/nav styling
- [ ] Empty state styling
- [ ] Button styles: primary (create/submit), secondary (cancel), danger (delete)
- [ ] Loading states (optional: subtle animation for HTMX hx-indicator)
- [ ] Print stylesheet (optional but nice)

## Acceptance criteria

- Looks good on mobile (375px width) and desktop (1024px+)
- Touch targets are at least 44x44px
- No horizontal scrolling on mobile
- Readable typography
- Consistent spacing and color palette
