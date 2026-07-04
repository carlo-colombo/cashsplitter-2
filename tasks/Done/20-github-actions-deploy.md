# Create GitHub Actions deploy workflow

**Priority:** high
**Depends on:** 19 (e2e tests)
**Status:** TODO

## Description

Create `.github/workflows/deploy.yml` — CI/CD pipeline that runs tests and deploys to GitHub Pages.

## Tasks

- [ ] **Trigger**: on push to `main` branch
- [ ] **Jobs**:
  1. **Test**:
     - Checkout code
     - Setup Node.js
     - Install dependencies (`npm ci`)
     - Install Playwright browsers
     - Run Playwright tests
  2. **Deploy** (if tests pass):
     - Use `peaceiris/actions-gh-pages` or `JamesIves/github-pages-deploy-action`
     - Deploy entire repository to `gh-pages` branch
     - (Or a specific `dist` folder if build step exists)
- [ ] Ensure no build step is needed (static HTML app — just copy files)
- [ ] Configure GitHub Pages in repo settings (document)
- [ ] Add badge to README (optional)

## Acceptance criteria

- Push to `main` triggers the workflow
- Tests run and pass before deployment
- On success, app is deployed to `https://{user}.github.io/cashsplitter-2/`
- GitHub Pages URL works and shows the app
