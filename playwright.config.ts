import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // webR downloads R the first time, so allow a generous budget. It must cover
  // the longest test's waits combined: a cold R boot (180 s) plus a run (120 s).
  timeout: 300_000,
  expect: { timeout: 120_000 },
  // The html report writes playwright-report/, which CI uploads when a run fails.
  reporter: [['list'], ['html', { open: 'never' }]],
  // Tests download R and packages from the network; one retry absorbs a blip,
  // and a trace of the failed attempt makes the uploaded report diagnosable.
  retries: process.env.CI ? 1 : 0,
  // The first-visit tour is marked as seen, so it does not cover the pages under
  // test; e2e/tour.spec.ts clears this to test the tour itself.
  use: {
    baseURL: 'http://localhost:4173/StatLab/',
    trace: 'retain-on-failure',
    storageState: { cookies: [], origins: [{ origin: 'http://localhost:4173', localStorage: [{ name: 'statlab.tour.v1', value: 'done' }] }] },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/StatLab/',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
