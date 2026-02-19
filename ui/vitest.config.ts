import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

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
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web/src'),
      '@hello-sparql/ui': path.resolve(__dirname, './packages/ui/src'),
      '@hello-sparql/api-client': path.resolve(__dirname, './packages/api-client/src'),
      '@hello-sparql/types': path.resolve(__dirname, './packages/types/src'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
});
