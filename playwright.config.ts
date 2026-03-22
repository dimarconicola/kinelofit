import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
const shouldSkipBuild = process.env.PW_SKIP_BUILD === '1';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['line'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3001',
    locale: 'it-IT',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ],
  webServer: {
    command: shouldSkipBuild
      ? 'npm run start -- --hostname 127.0.0.1 --port 3001'
      : 'npm run build && npm run start -- --hostname 127.0.0.1 --port 3001',
    url: 'http://127.0.0.1:3001/it',
    reuseExistingServer: !isCI,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe'
  }
});
