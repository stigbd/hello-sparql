import { createSPARQLClient } from '@hello-sparql/api-client';
import type { Prefix } from '@hello-sparql/types';
import { useEffect, useState } from 'react';

interface UsePrefixesResult {
  prefixes: Prefix[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePrefixes = (): UsePrefixesResult => {
  const [prefixes, setPrefixes] = useState<Prefix[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrefixes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const client = createSPARQLClient();
      const data = await client.getPrefixes();
      setPrefixes(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prefixes';
      setError(errorMessage);
      console.error('Error fetching prefixes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchPrefixes is stable and only needs to run once on mount
  useEffect(() => {
    fetchPrefixes();
  }, []);

  return {
    prefixes,
    isLoading,
    error,
    refetch: fetchPrefixes,
  };
};
