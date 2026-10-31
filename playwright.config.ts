import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // 1. Default Chromium (Clean & reliable for CI/CD and auth tests)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 2. Optional Brave profile (runs only when BRAVE_PATH environment variable is configured)
    ...(process.env.BRAVE_PATH
      ? [
          {
            name: 'brave',
            use: {
              ...devices['Desktop Chrome'],
              launchOptions: {
                executablePath: process.env.BRAVE_PATH,
                args: ['--disable-brave-extension'],
              },
            },
          },
        ]
      : []),
  ],
});
