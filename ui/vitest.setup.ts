import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
process.env.VITE_SPARQL_ENDPOINT = 'http://localhost:8000';

// Mock performance.now() for consistent timing tests
const originalPerformance = global.performance;
let mockTime = 0;
global.performance = {
  ...originalPerformance,
  now: vi.fn(() => {
    mockTime += 100;
    return mockTime;
  }),
} as any;

// Mock FormData if not available
if (typeof FormData === 'undefined') {
  class FormDataMock {
    private data: Map<string, string | Blob>;

    constructor() {
      this.data = new Map();
    }

    append(key: string, value: string | Blob): void {
      this.data.set(key, value);
    }

    get(key: string): string | Blob | null {
      return this.data.get(key) || null;
    }

    has(key: string): boolean {
      return this.data.has(key);
    }

    delete(key: string): void {
      this.data.delete(key);
    }

    entries() {
      return this.data.entries();
    }

    keys() {
      return this.data.keys();
    }

    values() {
      return this.data.values();
    }
  }

  global.FormData = FormDataMock as any;
}

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
        args[0].includes('Error: Could not parse CSS stylesheet'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
