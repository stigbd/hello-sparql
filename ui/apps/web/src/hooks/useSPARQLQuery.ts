import { useMutation } from '@tanstack/react-query';
import { createSPARQLClient, type SPARQLAPIError } from '@hello-sparql/api-client';
import type { SPARQLQueryRequest, SerializationFormat } from '@hello-sparql/types';

interface UseSPARQLQueryOptions {
  onSuccess?: (data: string, duration: number, length: number) => void;
  onError?: (error: SPARQLAPIError) => void;
}

export const useSPARQLQuery = (options?: UseSPARQLQueryOptions) => {
  const client = createSPARQLClient();

  const mutation = useMutation({
    mutationFn: async ({
      request,
      format = 'txt',
    }: {
      request: SPARQLQueryRequest;
      format?: SerializationFormat;
    }) => {
      const startTime = performance.now();
      const response = await client.executeQuery(request, format);
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000;

      return { result: response.result, duration, length: response.length };
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data.result, data.duration, data.length);
    },
    onError: (error: SPARQLAPIError) => {
      options?.onError?.(error);
    },
  });

  return {
    executeQuery: mutation.mutate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
};
