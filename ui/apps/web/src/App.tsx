import type React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QueryExplorer } from './components/QueryExplorer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <QueryExplorer />
    </QueryClientProvider>
  );
};

export default App;
