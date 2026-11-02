import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_PORT = process.env.PORT ? Number(process.env.PORT) : 5501;
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${DEFAULT_PORT}`;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx http-server "Front end" -p ${DEFAULT_PORT} -c-1 --cors`,
    url: `${BASE_URL}/index.html`,
    reuseExistingServer: true,
    timeout: 15000,
  },
  metadata: {
    baseURL: BASE_URL,
    backendURL: BACKEND_URL,
  },
});
