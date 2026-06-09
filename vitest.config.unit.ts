import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: 'happy-dom',
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      // The same-origin WebDAV proxy guard (functions/_shared) is plain TS.
      'functions/**/*.{test,spec}.{js,ts}',
    ],
    exclude: [
      'src/**/*.stories.{js,ts}',
      '**/node_modules/**',
      // Browser-mode contract tests run separately (npm run test:plugins).
      '**/*.browser.{test,spec}.{js,ts}',
    ],
  },
});
