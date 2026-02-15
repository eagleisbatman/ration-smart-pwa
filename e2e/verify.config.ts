import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:9000',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    ...devices['Pixel 7'],
  },
  projects: [
    {
      name: 'verify',
      testMatch: 'verify-fixes.spec.ts',
    },
    {
      name: 'walkthrough',
      testMatch: 'form-walkthrough.spec.ts',
    },
  ],
});
