import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte(),
    storybookTest({
      storybookScript: 'npm run storybook',
    }),
  ],
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      provider: 'playwright',
      instances: [
        {
          browser: 'chromium',
        },
      ],
      screenshotFailures: false,
    },
    setupFiles: ['./.storybook/vitest.setup.ts'],
  },
});