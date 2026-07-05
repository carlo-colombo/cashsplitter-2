import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  use: {
    baseURL: process.env.BASE_URL || 'https://carlo-colombo.github.io/cashsplitter-2',
    trace: 'on-first-retry',
  },
})
