#!/bin/bash
set -e

echo "Setting up React + TypeScript UI with Biome..."

# Navigate to UI directory
cd "$(dirname "$0")"

# ============================================================================
# Create API Client
# ============================================================================
cat > packages/api-client/src/index.ts << 'EOF'
import type {
  SPARQLQueryRequest,
  SPARQLError,
  SerializationFormat,
} from '@hello-sparql/types';

export class SPARQLAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public detail?: string
  ) {
    super(message);
    this.name = 'SPARQLAPIError';
  }
}

export interface SPARQLClientConfig {
  baseURL?: string;
  timeout?: number;
}

export class SPARQLClient {
  private baseURL: string;
  private timeout: number;

  constructor(config: SPARQLClientConfig = {}) {
    this.baseURL = config.baseURL || import.meta.env.VITE_SPARQL_ENDPOINT || 'http://localhost:8000';
    this.timeout = config.timeout || 60000;
  }

  async executeQuery(
    request: SPARQLQueryRequest,
    format: SerializationFormat = 'txt'
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const acceptHeader = this.getAcceptHeader(format);

      const response = await fetch(`${this.baseURL}/sparql`, {
        method: 'POST',
        body: JSON.stringify({
          query: request.query,
          data: request.data,
        }),
        headers: {
          'Content-Type': 'application/json',
          Accept: acceptHeader,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: SPARQLError = await response.json().catch(() => ({
          detail: `HTTP error ${response.status}: ${response.statusText}`,
        }));
        throw new SPARQLAPIError(
          errorData.detail || 'Failed to execute query',
          response.status,
          errorData.detail
        );
      }

      return await response.text();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof SPARQLAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new SPARQLAPIError('Request timeout', 408);
        }
        throw new SPARQLAPIError(error.message);
      }

      throw new SPARQLAPIError('Unknown error occurred');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private getAcceptHeader(format: SerializationFormat): string {
    switch (format) {
      case 'json':
        return 'application/json';
      case 'csv':
        return 'text/csv';
      case 'xml':
        return 'text/xml';
      case 'txt':
      default:
        return 'text/plain';
    }
  }
}

export const createSPARQLClient = (config?: SPARQLClientConfig) =>
  new SPARQLClient(config);
EOF

# ============================================================================
# Create UI Components
# ============================================================================
cat > packages/ui/src/index.ts << 'EOF'
export { CodeEditor } from './components/CodeEditor';
export type { CodeEditorProps } from './components/CodeEditor';

export { ResultsTable } from './components/ResultsTable';
export type { ResultsTableProps } from './components/ResultsTable';

export { LoadingSpinner } from './components/LoadingSpinner';
export type { LoadingSpinnerProps } from './components/LoadingSpinner';
EOF

cat > packages/ui/package.json << 'EOF'
{
  "name": "@hello-sparql/ui",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "biome lint src",
    "lint:fix": "biome lint --write src",
    "format": "biome format --write src",
    "format:check": "biome format src",
    "check": "biome check src",
    "check:fix": "biome check --write src",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@hello-sparql/types": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "typescript": "^5.3.3"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
EOF

cat > packages/ui/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "noEmit": false,
    "allowImportingTsExtensions": false,
    "moduleResolution": "node"
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ],
  "references": [
    {
      "path": "../types"
    }
  ]
}
EOF

cat > packages/ui/src/components/CodeEditor.tsx << 'EOF'
import React, { useRef, useEffect } from 'react';

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  minHeight?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'turtle',
  placeholder = '',
  readOnly = false,
  className = '',
  minHeight = '300px',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className={`code-editor ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        readOnly={readOnly}
        spellCheck={false}
        className="code-editor-textarea"
        style={{
          minHeight,
          width: '100%',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          padding: '12px',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          backgroundColor: '#f8fafc',
          color: '#1e293b',
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
};

export default CodeEditor;
EOF

cat > packages/ui/src/components/ResultsTable.tsx << 'EOF'
import React from 'react';

export interface ResultsTableProps {
  data: string;
  format: 'txt' | 'json' | 'csv' | 'xml';
  className?: string;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  data,
  format,
  className = '',
}) => {
  const renderContent = () => {
    if (format === 'txt') {
      const lines = data.split('\n').filter((line) => line.trim());
      if (lines.length === 0) {
        return <div className="no-results">No results</div>;
      }

      if (lines[0].includes('|')) {
        const rows = lines.map((line) =>
          line.split('|').map((cell) => cell.trim()).filter((cell) => cell)
        );

        if (rows.length === 0) {
          return <div className="no-results">No results</div>;
        }

        const headers = rows[0];
        const dataRows = rows.slice(2);

        return (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="results-table">
              <thead>
                <tr>
                  {headers.map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    if (format === 'json') {
      try {
        const parsed = JSON.parse(data);
        return (
          <pre className="json-output">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        );
      } catch (error) {
        return (
          <div className="error-message">
            Failed to parse JSON: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        );
      }
    }

    return (
      <pre className="raw-output">
        {data}
      </pre>
    );
  };

  return (
    <div className={`results-container ${className}`}>
      <style>{`
        .results-container {
          margin-top: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          padding: 16px;
        }

        .table-container {
          max-width: 100%;
        }

        .results-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .results-table th {
          background-color: #f1f5f9;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }

        .results-table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .results-table tbody tr:hover {
          background-color: #f8fafc;
        }

        .results-table tbody tr:last-child td {
          border-bottom: none;
        }

        .json-output,
        .raw-output {
          margin: 0;
          padding: 16px;
          background-color: #f8fafc;
          border-radius: 4px;
          overflow-x: auto;
          font-family: Monaco, Menlo, "Ubuntu Mono", Consolas, monospace;
          font-size: 13px;
          line-height: 1.5;
        }

        .no-results {
          padding: 32px;
          text-align: center;
          color: #64748b;
        }

        .error-message {
          padding: 16px;
          background-color: #fee;
          color: #c00;
          border-radius: 4px;
        }
      `}</style>
      {renderContent()}
    </div>
  );
};

export default ResultsTable;
EOF

cat > packages/ui/src/components/LoadingSpinner.tsx << 'EOF'
import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  className = '',
}) => {
  const sizeMap = {
    small: '20px',
    medium: '40px',
    large: '60px',
  };

  const spinnerSize = sizeMap[size];

  return (
    <div className={`loading-spinner ${className}`}>
      <style>{`
        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .spinner {
          border: 3px solid #f3f4f6;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div
        className="spinner"
        style={{
          width: spinnerSize,
          height: spinnerSize,
        }}
      />
    </div>
  );
};

export default LoadingSpinner;
EOF

# ============================================================================
# Create Web App
# ============================================================================
cat > apps/web/package.json << 'EOF'
{
  "name": "@hello-sparql/web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "biome lint src",
    "lint:fix": "biome lint --write src",
    "format": "biome format --write src",
    "format:check": "biome format src",
    "check": "biome check src",
    "check:fix": "biome check --write src",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@hello-sparql/api-client": "workspace:*",
    "@hello-sparql/types": "workspace:*",
    "@hello-sparql/ui": "workspace:*",
    "@tanstack/react-query": "^5.17.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
EOF

cat > apps/web/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    },
    "noEmit": false,
    "allowImportingTsExtensions": false,
    "moduleResolution": "node"
  },
  "include": [
    "src"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ],
  "references": [
    {
      "path": "../../packages/types"
    },
    {
      "path": "../../packages/api-client"
    },
    {
      "path": "../../packages/ui"
    }
  ]
}
EOF

cat > apps/web/vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  envPrefix: 'VITE_',
});
EOF

cat > apps/web/index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/sparql-40.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="SPARQL Query Explorer - Execute SPARQL queries on RDF data" />
    <title>SPARQL Query Explorer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

cat > apps/web/.env.example << 'EOF'
VITE_SPARQL_ENDPOINT=http://localhost:8000
VITE_API_URL=http://localhost:8000
VITE_APP_TITLE=SPARQL Query Explorer
EOF

cat > apps/web/.env.production << 'EOF'
VITE_SPARQL_ENDPOINT=http://api:8000
VITE_API_URL=http://api:8000
VITE_APP_TITLE=SPARQL Query Explorer
EOF

cat > apps/web/src/vite-env.d.ts << 'EOF'
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPARQL_ENDPOINT: string;
  readonly VITE_API_URL: string;
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
EOF

cat > apps/web/src/main.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

cat > apps/web/src/App.tsx << 'EOF'
import React from 'react';
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
EOF

cat > apps/web/src/constants/queries.ts << 'EOF'
import type { QueryTemplate } from '@hello-sparql/types';

export const QUERY_TEMPLATES: Record<string, QueryTemplate> = {
  select: {
    type: 'select',
    label: 'Basic Select',
    query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ex: <http://example.org/>

SELECT ?s ?p ?o
WHERE {
    ?s ?p ?o .
}`,
  },
  count: {
    type: 'count',
    label: 'Count Query',
    query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ex: <http://example.org/>

SELECT (COUNT(*) AS ?count)
WHERE {
    ?s ?p ?o .
}`,
  },
  construct: {
    type: 'construct',
    label: 'Basic Construct',
    query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ex: <http://example.org/>

CONSTRUCT {
    ?s ?p ?o .
} WHERE {
    ?s ?p ?o .
}`,
  },
};

export const INITIAL_DATA = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix ex: <http://example.org/>.

ex:John rdf:type ex:Person ;
        ex:name "John" ;
        ex:age 30 .

ex:Jane rdf:type ex:Person ;
        ex:name "Jane" ;
        ex:age 25 .

ex:Kitty rdf:type ex:Cat ;
        ex:name "Kitty" ;
        ex:age 7 .`;

export const DEFAULT_QUERY = QUERY_TEMPLATES.select.query;
EOF

cat > apps/web/src/hooks/useSPARQLQuery.ts << 'EOF'
import { useMutation } from '@tanstack/react-query';
import { createSPARQLClient, SPARQLAPIError } from '@hello-sparql/api-client';
import type { SPARQLQueryRequest, SerializationFormat } from '@hello-sparql/types';

interface UseSPARQLQueryOptions {
  onSuccess?: (data: string, duration: number) => void;
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
      const result = await client.executeQuery(request, format);
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000;

      return { result, duration };
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data.result, data.duration);
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
EOF

cat > apps/web/src/components/QueryExplorer.tsx << 'EOF'
import React, { useState } from 'react';
import { CodeEditor, ResultsTable, LoadingSpinner } from '@hello-sparql/ui';
import type { SerializationFormat } from '@hello-sparql/types';
import { useSPARQLQuery } from '../hooks/useSPARQLQuery';
import { QUERY_TEMPLATES, INITIAL_DATA, DEFAULT_QUERY } from '../constants/queries';

export const QueryExplorer: React.FC = () => {
  const [query, setQuery] = useState<string>(DEFAULT_QUERY);
  const [data, setData] = useState<string>(INITIAL_DATA);
  const [selectedFormat, setSelectedFormat] = useState<SerializationFormat>('txt');
  const [result, setResult] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { executeQuery, isLoading } = useSPARQLQuery({
    onSuccess: (data, executionDuration) => {
      setResult(data);
      setDuration(executionDuration);
      setErrorMessage('');
    },
    onError: (error) => {
      setErrorMessage(error.detail || error.message);
      setResult('');
    },
  });

  const handleExecuteQuery = () => {
    if (!query.trim() || !data.trim()) {
      setErrorMessage('Both query and data are required');
      return;
    }

    executeQuery({
      request: { query, data },
      format: selectedFormat,
    });
  };

  const handleTemplateChange = (templateKey: string) => {
    const template = QUERY_TEMPLATES[templateKey];
    if (template) {
      setQuery(template.query);
    }
  };

  return (
    <div className="query-explorer">
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: #f8fafc;
        }

        .query-explorer {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
        }

        .header {
          margin-bottom: 32px;
          text-align: center;
        }

        .header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .header p {
          color: #64748b;
          font-size: 16px;
        }

        .controls {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          align-items: center;
          flex-wrap: wrap;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-group label {
          font-weight: 600;
          color: #475569;
          font-size: 14px;
        }

        .select {
          padding: 8px 32px 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background-color: white;
          color: #1e293b;
          font-size: 14px;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }

        .select:hover {
          border-color: #cbd5e1;
        }

        .select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .button {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .button-primary {
          background-color: #3b82f6;
          color: white;
        }

        .button-primary:hover:not(:disabled) {
          background-color: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .button-primary:disabled {
          background-color: #94a3b8;
          cursor: not-allowed;
        }

        .editors-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        @media (max-width: 1024px) {
          .editors-container {
            grid-template-columns: 1fr;
          }
        }

        .editor-panel {
          background: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .editor-panel h2 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .editor-hint {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 12px;
          font-style: italic;
        }

        .results-section {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .results-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
        }

        .execution-time {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .error-banner {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 24px;
          color: #991b1b;
        }

        .error-banner h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .error-banner p {
          font-size: 14px;
          line-height: 1.5;
        }

        .empty-state {
          text-align: center;
          padding: 64px 24px;
          color: #64748b;
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #475569;
        }

        .empty-state p {
          font-size: 14px;
        }
      `}</style>

      <div className="header">
        <h1>
          <span>📊</span>
          SPARQL Query Explorer
        </h1>
        <p>Execute SPARQL queries on RDF data and explore the results</p>
      </div>

      <div className="controls">
        <div className="control-group">
          <label htmlFor="query-template">Query Template:</label>
          <select
            id="query-template"
            className="select"
            onChange={(e) => handleTemplateChange(e.target.value)}
            defaultValue="select"
          >
            {Object.entries(QUERY_TEMPLATES).map(([key, template]) => (
              <option key={key} value={key}>
                {template.label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="result-format">Result Format:</label>
          <select
            id="result-format"
            className="select"
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as SerializationFormat)}
          >
            <option value="txt">Text (Table)</option>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="xml">XML</option>
          </select>
        </div>

        <button
          className="button button-primary"
          onClick={handleExecuteQuery}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span>⏳</span>
              Executing...
            </>
          ) : (
            <>
              <span>▶️</span>
              Execute Query
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="error-banner">
          <h3>❌ Error</h3>
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="editors-container">
        <div className="editor-panel">
          <h2>🔍 SPARQL Query</h2>
          <p className="editor-hint">Enter your SPARQL query below</p>
          <CodeEditor
            value={query}
            onChange={setQuery}
            language="sparql"
            placeholder="Enter your SPARQL query here..."
            minHeight="400px"
          />
        </div>

        <div className="editor-panel">
          <h2>📝 RDF Data</h2>
          <p className="editor-hint">Enter your RDF data in Turtle format</p>
          <CodeEditor
            value={data}
            onChange={setData}
            language="turtle"
            placeholder="Enter your RDF data here..."
            minHeight="400px"
          />
        </div>
      </div>

      <div className="results-section">
        <div className="results-header">
          <h2>Results</h2>
          {duration > 0 && (
            <span className="execution-time">
              Executed in {duration.toFixed(3)}s
            </span>
          )}
        </div>

        {isLoading && <LoadingSpinner size="large" />}

        {!isLoading && !result && !errorMessage && (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <h3>Ready to execute</h3>
            <p>Enter your query and data, then click "Execute Query" to see results</p>
          </div>
        )}

        {!isLoading && result && (
          <ResultsTable data={result} format={selectedFormat} />
        )}
      </div>
    </div>
  );
};

export default QueryExplorer;
EOF

# ============================================================================
# Update .gitignore
# ============================================================================
cat > .gitignore << 'EOF'
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Dependencies
node_modules
.pnpm-store

# Build outputs
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment variables
.env
.env.local
.env.production.local
.env.development.local
.env.test.local

# TypeScript
*.tsbuildinfo

# Testing
coverage
.nyc_output

# Misc
.cache
.temp
.tmp

# Biome
.biome

# Python (backup Streamlit app)
__pycache__/
*.py[oc]
*.egg-info
.venv

# OS
.DS_Store
Thumbs.db
EOF

# ============================================================================
# Update Dockerfile
# ============================================================================
cat > Dockerfile << 'EOF'
# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
WORKDIR /app/apps/web
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
RUN echo 'server { \
    listen 3000; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json; \
    \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /api/ { \
        proxy_pass http://api:8000/; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
    } \
    \
    location /health { \
        access_log off; \
        return 200 "healthy\n"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

echo ""
echo "✅ All files created successfully!"
echo ""
echo "Next steps:"
echo "1. Run: pnpm install"
echo "2. Run: pnpm dev"
echo "3. Open http://localhost:3000"
echo ""
echo "For production:"
echo "- docker compose up --build"
echo ""
