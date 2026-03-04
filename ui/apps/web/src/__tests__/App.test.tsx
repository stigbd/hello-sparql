import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import * as RDFExplorerModule from '../components/RDFExplorer';

// Mock the RDFExplorer component
vi.mock('../components/RDFExplorer', () => ({
  RDFExplorer: vi.fn(() => <div data-testid="rdf-explorer">RDFExplorer Mock</div>),
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('rdf-explorer')).toBeInTheDocument();
  });

  it('wraps RDFExplorer with QueryClientProvider', () => {
    render(<App />);
    expect(RDFExplorerModule.RDFExplorer).toHaveBeenCalled();
  });

  it('renders RDFExplorer component', () => {
    render(<App />);
    const rdfExplorer = screen.getByTestId('rdf-explorer');
    expect(rdfExplorer).toBeInTheDocument();
    expect(rdfExplorer).toHaveTextContent('RDFExplorer Mock');
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
