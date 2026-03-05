import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['apps/*/src/**/*.{ts,tsx}', 'packages/*/src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        '**/dist/**',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        '**/vite-env.d.ts',
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/src/main.tsx',
        'packages/types/src/index.ts',
        'packages/ui/src/index.ts',
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 70,
        statements: 75,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web/src'),
      '@rdf-explorer/ui': path.resolve(__dirname, './packages/ui/src'),
      '@rdf-explorer/api-client': path.resolve(__dirname, './packages/api-client/src'),
      '@rdf-explorer/types': path.resolve(__dirname, './packages/types/src'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
});
