import * as apiClient from '@hello-sparql/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSPARQLQuery } from '../useSPARQLQuery';

// Mock the API client
vi.mock('@hello-sparql/api-client', () => ({
  createSPARQLClient: vi.fn(() => ({
    executeQuery: vi.fn(),
  })),
  SPARQLAPIError: class SPARQLAPIError extends Error {
    constructor(
      message: string,
      public statusCode?: number,
      public detail?: string
    ) {
      super(message);
      this.name = 'SPARQLAPIError';
    }
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useSPARQLQuery', () => {
  let mockExecuteQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecuteQuery = vi.fn();
    (apiClient.createSPARQLClient as ReturnType<typeof vi.fn>).mockReturnValue({
      executeQuery: mockExecuteQuery,
    });
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useSPARQLQuery(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('executes query successfully', async () => {
    const mockResult = {
      length: 1,
      result: '| s | p | o |\n|---|---|---|\n| ex:John | rdf:type | ex:Person |',
    };
    mockExecuteQuery.mockResolvedValue(mockResult);

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSPARQLQuery({ onSuccess }), {
      wrapper: createWrapper(),
    });

    const request = {
      query: 'SELECT * WHERE { ?s ?p ?o }',
      data: '@prefix ex: <http://example.org/>.',
    };

    result.current.executeQuery({ request, format: 'txt' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data?.result).toBe(mockResult.result);
    expect(onSuccess).toHaveBeenCalled();
    expect(onSuccess.mock.calls[0][0]).toBe(mockResult.result);
    expect(typeof onSuccess.mock.calls[0][1]).toBe('number'); // duration
    expect(onSuccess.mock.calls[0][2]).toBe(1); // length
  });

  it('handles query execution error', async () => {
    const mockError = new apiClient.SPARQLAPIError('Query failed', 400, 'Invalid SPARQL syntax');
    mockExecuteQuery.mockRejectedValue(mockError);

    const onError = vi.fn();
    const { result } = renderHook(() => useSPARQLQuery({ onError }), {
      wrapper: createWrapper(),
    });

    const request = {
      query: 'INVALID QUERY',
      data: '@prefix ex: <http://example.org/>.',
    };

    result.current.executeQuery({ request, format: 'txt' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(onError).toHaveBeenCalledWith(mockError);
  });

  it('executes query with different formats', async () => {
    const mockResult = { length: 0, result: '{"results":[]}' };
    mockExecuteQuery.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useSPARQLQuery(), {
      wrapper: createWrapper(),
    });

    const request = {
      query: 'SELECT * WHERE { ?s ?p ?o }',
      data: '@prefix ex: <http://example.org/>.',
    };

    result.current.executeQuery({ request, format: 'json' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockExecuteQuery).toHaveBeenCalledWith(request, 'json');
  });

  it('defaults to txt format when format is not specified', async () => {
    const mockResult = { length: 0, result: 'results' };
    mockExecuteQuery.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useSPARQLQuery(), {
      wrapper: createWrapper(),
    });

    const request = {
      query: 'SELECT * WHERE { ?s ?p ?o }',
      data: '@prefix ex: <http://example.org/>.',
    };

    result.current.executeQuery({ request });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockExecuteQuery).toHaveBeenCalledWith(request, 'txt');
  });

  it('calculates execution duration', async () => {
    const mockResult = { length: 0, result: 'results' };
    mockExecuteQuery.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockResult), 100);
        })
    );

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSPARQLQuery({ onSuccess }), {
      wrapper: createWrapper(),
    });

    const request = {
      query: 'SELECT * WHERE { ?s ?p ?o }',
      data: '@prefix ex: <http://example.org/>.',
    };

    result.current.executeQuery({ request, format: 'txt' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalled();
    const duration = onSuccess.mock.calls[0][1];
    expect(typeof duration).toBe('number');
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('can reset the mutation state', async () => {
    const mockResult = { length: 0, result: 'results' };
    mockExecuteQuery.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useSPARQLQuery(), {
      wrapper: createWrapper(),
    });

    const request = {
      query: 'SELECT * WHERE { ?s ?p ?o }',
      data: '@prefix ex: <http://example.org/>.',
    };

    result.current.executeQuery({ request, format: 'txt' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    result.current.reset();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  it('creates SPARQL client on hook initialization', () => {
    renderHook(() => useSPARQLQuery(), {
      wrapper: createWrapper(),
    });

    expect(apiClient.createSPARQLClient).toHaveBeenCalled();
  });

  it('handles multiple sequential queries', async () => {
    const mockResult1 = { length: 1, result: 'result1' };
    const mockResult2 = { length: 2, result: 'result2' };
    mockExecuteQuery.mockResolvedValueOnce(mockResult1).mockResolvedValueOnce(mockResult2);

    const { result } = renderHook(() => useSPARQLQuery(), {
      wrapper: createWrapper(),
    });

    const request1 = {
      query: 'SELECT * WHERE { ?s ?p ?o }',
      data: '@prefix ex: <http://example.org/>.',
    };

    const request2 = {
      query: 'SELECT ?s WHERE { ?s ?p ?o }',
      data: '@prefix ex: <http://example.org/>.',
    };

    result.current.executeQuery({ request: request1, format: 'txt' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.result).toBe(mockResult1.result);

    result.current.executeQuery({ request: request2, format: 'txt' });

    await waitFor(() => {
      expect(result.current.data?.result).toBe(mockResult2.result);
    });
  });

  it('does not call onSuccess when query fails', async () => {
    const mockError = new apiClient.SPARQLAPIError('Query failed');
    mockExecuteQuery.mockRejectedValue(mockError);

    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useSPARQLQuery({ onSuccess, onError }), {
      wrapper: createWrapper(),
    });

    const request = {
      query: 'INVALID',
      data: 'data',
    };

    result.current.executeQuery({ request, format: 'txt' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it('does not call onError when query succeeds', async () => {
    const mockResult = { length: 0, result: 'results' };
    mockExecuteQuery.mockResolvedValue(mockResult);

    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useSPARQLQuery({ onSuccess, onError }), {
      wrapper: createWrapper(),
    });

    const request = {
      query: 'SELECT * WHERE { ?s ?p ?o }',
      data: '@prefix ex: <http://example.org/>.',
    };

    result.current.executeQuery({ request, format: 'txt' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
