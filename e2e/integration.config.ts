import { defineConfig, devices } from '@playwright/test';

const RUN_ID = new Date().toISOString().replace(/[T:]/g, '-').replace(/\..+/, '');

export default defineConfig({
  testDir: './tests',
  outputDir: `./test-results/${RUN_ID}`,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: `./test-reports/integration-${RUN_ID}`, open: 'never' }],
    ['list'],
  ],
  timeout: 900_000,    // 15 minutes for the entire multi-user test
  expect: { timeout: 15_000 },

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:9000',
    video: 'off',       // Too expensive for 4 contexts
    screenshot: 'on',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    ...devices['Pixel 7'],
  },

  projects: [
    {
      name: 'multi-user-integration',
      testMatch: 'multi-user-integration.spec.ts',
    },
  ],
});
