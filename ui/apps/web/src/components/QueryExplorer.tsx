import type React from 'react';
import { useState } from 'react';
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
          type="button"
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
            <span className="execution-time">Executed in {duration.toFixed(3)}s</span>
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

        {!isLoading && result && <ResultsTable data={result} format={selectedFormat} />}
      </div>
    </div>
  );
};

export default QueryExplorer;
