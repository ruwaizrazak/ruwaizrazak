import { defineConfig, devices } from '@playwright/test';

// LEARN: 4322, not Astro's default 4321 — the dev server often occupies 4321,
// and `reuseExistingServer` would silently point the whole suite at the dev
// build (Astro toolbar, HMR client, unminified CSS) instead of the real output.
const PORT = 4322;
// LEARN: 127.0.0.1, not localhost. `astro preview` binds IPv6-only ([::1]) by
// default, and Node's fetch resolves `localhost` to 127.0.0.1 first and then
// STALLS on the dead socket rather than failing fast — so Playwright's webServer
// readiness probe never connects and the whole run hangs with no output. Binding
// and probing the same IPv4 address (see --host below) makes both ends agree.
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // webkit is not optional here: TocPill carries two iOS-Safari-specific
    // workarounds (backdrop-filter hit-testing, the rounded-full radius
    // fallback) that chromium can never regress on.
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
  // TEST_FIXTURES=1 swaps the empty webmentions.json for the sample fixture so
  // the reply cap and Show more/less toggle actually render. See Webmentions.astro.
  webServer: {
    command: `TEST_FIXTURES=1 npm run build && npm run preview -- --host ${HOST} --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
