import { defineConfig } from 'vitest/config';

/**
 * Browser-mode certification suite for the storage backends (real Chromium
 * via Playwright): the same backend contract that runs on fakes in the unit
 * suite runs here against real OPFS, real IndexedDB, and a real Worker — any
 * fake/reality fidelity gap shows up as a unit-vs-browser diff. On-demand
 * (`npm run test:storage`), not part of `validate`.
 */
export default defineConfig({
  test: {
    name: 'storage',
    include: ['src/lib/storage/**/*.browser.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
    },
  },
});
