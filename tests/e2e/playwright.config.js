import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  timeout: 20000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3333',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node server.js',
    port: 3333,
    reuseExistingServer: true,
    timeout: 10000,
  },
})
