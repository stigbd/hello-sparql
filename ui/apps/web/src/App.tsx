import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type React from 'react';
import { RDFExplorer } from './components/RDFExplorer';

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
      <RDFExplorer />
    </QueryClientProvider>
  );
};

export default App;
