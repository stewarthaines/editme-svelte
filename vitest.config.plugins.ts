import { defineConfig } from 'vitest/config';

/**
 * Browser-mode contract tests for the host ↔ plugin boundary (real Chromium via
 * Playwright), so the OPFS handle hand-off runs for real. Separate from the
 * happy-dom unit suite; run with `npm run test:plugins`.
 */
export default defineConfig({
  test: {
    name: 'plugins',
    include: ['src/lib/plugins/**/*.browser.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
    },
  },
});
