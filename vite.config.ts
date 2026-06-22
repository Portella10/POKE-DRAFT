/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Playwright owns e2e/**; keep it out of the Vitest run.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/data/**', 'src/game/**', 'src/store/**'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', 'src/test/**'],
      thresholds: {
        lines: 80,
        'src/data/**': { lines: 90, functions: 90, branches: 80, statements: 90 },
        'src/game/**': { lines: 90, functions: 90, branches: 80, statements: 90 },
      },
    },
  },
});
