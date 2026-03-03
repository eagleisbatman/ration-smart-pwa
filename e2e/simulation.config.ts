import { defineConfig, devices } from '@playwright/test';

const RUN_ID = new Date().toISOString().replace(/[T:]/g, '-').replace(/\..+/, '');

export default defineConfig({
  testDir: './tests',
  outputDir: `./test-results/${RUN_ID}`,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: `./test-reports/${RUN_ID}`, open: 'never' }],
    ['list'],
  ],
  timeout: 120_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:9001',
    video: 'on',
    screenshot: 'on',
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    ...devices['Pixel 7'],
  },

  projects: [
    {
      name: 'simulation-flow',
      testMatch: 'simulation-flow.spec.ts',
    },
  ],
});
