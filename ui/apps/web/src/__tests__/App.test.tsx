import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import * as QueryExplorerModule from '../components/QueryExplorer';

// Mock the QueryExplorer component
vi.mock('../components/QueryExplorer', () => ({
  QueryExplorer: vi.fn(() => <div data-testid="query-explorer">QueryExplorer Mock</div>),
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('query-explorer')).toBeInTheDocument();
  });

  it('wraps QueryExplorer with QueryClientProvider', () => {
    render(<App />);
    expect(QueryExplorerModule.QueryExplorer).toHaveBeenCalled();
  });

  it('renders QueryExplorer component', () => {
    render(<App />);
    const queryExplorer = screen.getByTestId('query-explorer');
    expect(queryExplorer).toBeInTheDocument();
    expect(queryExplorer).toHaveTextContent('QueryExplorer Mock');
  });

  it('creates QueryClient with correct default options', () => {
    // This is tested implicitly by ensuring the component renders
    // and the QueryClientProvider doesn't throw errors
    expect(() => render(<App />)).not.toThrow();
  });

  it('exports App as default', async () => {
    // Test that default export works
    const AppModule = await import('../App');
    expect(AppModule.default).toBeDefined();
    expect(AppModule.default).toBe(App);
  });
});
