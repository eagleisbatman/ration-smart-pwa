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
    ['html', { outputFolder: `./test-reports/${RUN_ID}`, open: 'never' }],
    ['list'],
  ],
  timeout: 120_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:9000',
    video: 'on',
    screenshot: 'on',
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    ...devices['Pixel 7'],
  },

  projects: [
    {
      name: 'P1-farmer-india',
      testMatch: 'persona-farmer.spec.ts',
    },
    {
      name: 'P2-student-nepal',
      testMatch: 'persona-student.spec.ts',
    },
    {
      name: 'P3-ew-ethiopia',
      testMatch: 'persona-ew.spec.ts',
    },
    {
      name: 'P4-nutritionist-kenya',
      testMatch: 'persona-nutritionist.spec.ts',
    },
  ],
});
