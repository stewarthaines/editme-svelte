import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import packageJson from '../package.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    svelte(),
    storybookTest({
      storybookScript: 'npm run storybook',
    }),
  ],
  // Mirror the main vite config's build-time defines — code under test (e.g.
  // opf-utils' book-producer stamp) references them.
  define: {
    __VERSION__: JSON.stringify(packageJson.version),
  },
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
        {
          browser: 'firefox',
        },
      ],
      screenshotFailures: false,
    },
    setupFiles: ['./.storybook/vitest.setup.ts'],
  },
});
