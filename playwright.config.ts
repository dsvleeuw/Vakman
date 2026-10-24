import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
  },
  webServer: {
    command: 'bun run build && bunx vite preview --host 0.0.0.0 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    // build + prerender takes ~1-2 min on a cold machine
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'mobile',
      use: { viewport: { width: 360, height: 780 } },
    },
    {
      name: 'desktop',
      use: { viewport: { width: 1440, height: 900 } },
    },
  ],
});
