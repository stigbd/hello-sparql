# Testing Guide

## Quick Start

```bash
# Install dependencies (if not already done)
pnpm install

# Run all tests
pnpm test:run

# Run tests in watch mode (useful during development)
pnpm test

# Run tests with interactive UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage

# View HTML coverage report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

## Test Structure

Our test suite is organized into focused units:

### 1. UI Components (`packages/ui/src/components/__tests__/`)
- **LoadingSpinner.test.tsx**: Spinner states and sizes
- **CodeEditor.test.tsx**: Editor functionality and keyboard handling
- **ResultsTable.test.tsx**: Data display in various formats

### 2. API Client (`packages/api-client/src/__tests__/`)
- **index.test.ts**: SPARQL client, error handling, network requests

### 3. Web Application (`apps/web/src/`)
- **App.test.tsx**: Root application component
- **components/__tests__/QueryExplorer.test.tsx**: Main UI orchestration
- **hooks/__tests__/useSPARQLQuery.test.tsx**: React Query integration

## Writing Tests

### Example: Component Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders with initial state', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<MyComponent onChange={onChange} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(onChange).toHaveBeenCalled();
  });
});
```

### Example: Hook Test

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(0);
  });

  it('updates state', async () => {
    const { result } = renderHook(() => useMyHook());
    
    result.current.increment();
    
    await waitFor(() => {
      expect(result.current.value).toBe(1);
    });
  });
});
```

## Testing Patterns

### 1. Arrange-Act-Assert (AAA)
```typescript
it('increments counter', async () => {
  // Arrange: Set up test conditions
  const user = userEvent.setup();
  render(<Counter />);
  
  // Act: Perform the action
  await user.click(screen.getByRole('button'));
  
  // Assert: Verify the result
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### 2. User-Centric Testing
Focus on user interactions, not implementation:
```typescript
// ✅ Good: Test what users see/do
expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();

// ❌ Bad: Test implementation details
expect(component.state.isEnabled).toBe(true);
```

### 3. Mocking External Dependencies
```typescript
import { vi } from 'vitest';

// Mock module
vi.mock('../api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'test' }))
}));

// Mock fetch globally (already done in vitest.setup.ts)
global.fetch = vi.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ result: 'success' })
  })
);
```

## Coverage Goals

- **Minimum Coverage**: 80% across all metrics
- **Current Coverage**: 94% overall
- **Target Areas**:
  - Statements: >80%
  - Branches: >80%
  - Functions: >80%
  - Lines: >80%

### Checking Coverage for New Code

```bash
# Run coverage and check thresholds
pnpm test:coverage

# Coverage fails if below 80% in any metric
```

## Common Testing Scenarios

### Testing Async Operations
```typescript
it('loads data asynchronously', async () => {
  render(<AsyncComponent />);
  
  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
  
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

### Testing Error States
```typescript
it('displays error message on failure', async () => {
  mockFetch.mockRejectedValue(new Error('API Error'));
  
  render(<Component />);
  await user.click(screen.getByRole('button'));
  
  expect(await screen.findByText(/Error/)).toBeInTheDocument();
});
```

### Testing Forms
```typescript
it('submits form with user input', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  
  render(<Form onSubmit={onSubmit} />);
  
  await user.type(screen.getByLabelText('Name'), 'John Doe');
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  
  expect(onSubmit).toHaveBeenCalledWith({ name: 'John Doe' });
});
```

## Debugging Tests

### Using Vitest UI
```bash
pnpm test:ui
```
Then navigate to http://localhost:51204 in your browser for an interactive test runner.

### Debug Specific Test
```bash
# Run single test file
pnpm test CodeEditor.test.tsx

# Run test matching name
pnpm test -- -t "renders without crashing"
```

### Print Debug Output
```typescript
import { screen } from '@testing-library/react';

it('debugs component state', () => {
  render(<Component />);
  
  // Print DOM structure
  screen.debug();
  
  // Print specific element
  screen.debug(screen.getByRole('button'));
});
```

## CI/CD Integration

The test suite is designed for continuous integration:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: pnpm test:run

- name: Generate Coverage
  run: pnpm test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Troubleshooting

### Tests Timeout
Increase timeout for slow tests:
```typescript
it('slow operation', async () => {
  // Test code...
}, 10000); // 10 second timeout
```

### Mock Not Working
Ensure mock is before imports:
```typescript
vi.mock('../module'); // Must be at top level

import { Component } from '../Component';
```

### React Query Tests Failing
Wrap in QueryClientProvider:
```typescript
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

renderHook(() => useMyQuery(), { wrapper });
```

## Best Practices

1. **Keep tests simple**: One concept per test
2. **Use descriptive names**: Test name should explain what's being tested
3. **Test behavior, not implementation**: Focus on user-facing behavior
4. **Avoid test interdependence**: Each test should be independent
5. **Clean up after tests**: Use cleanup functions or afterEach hooks
6. **Mock external dependencies**: Don't make real API calls in tests
7. **Use realistic test data**: Test data should resemble production data
8. **Test error cases**: Don't just test the happy path

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [User Event API](https://testing-library.com/docs/user-event/intro)
- [Coverage Report](./coverage/index.html) (after running `pnpm test:coverage`)
- [Full Test Report](./TEST_REPORT.md)

## Getting Help

- Check existing tests for patterns
- Review [TEST_REPORT.md](./TEST_REPORT.md) for comprehensive coverage details
- Ask team members for guidance on complex scenarios
- Consult the official documentation linked above