import type { SerializationFormat } from '@hello-sparql/types';
import type React from 'react';
import { useState } from 'react';

export interface ResultsTableProps {
  data: string;
  format: SerializationFormat;
  className?: string;
}

type ViewMode = 'formatted' | 'raw';

export const ResultsTable: React.FC<ResultsTableProps> = ({ data, format, className = '' }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('formatted');

  const parseCSV = (csvData: string): { headers: string[]; rows: string[][] } | null => {
    try {
      const lines = csvData.trim().split('\n');
      if (lines.length === 0) return null;

      // First line is headers
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

      // Rest are data rows
      const rows = lines.slice(1).map((line) => {
        // Simple CSV parsing - handles quoted values
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));

        return values;
      });

      return { headers, rows };
    } catch (error) {
      console.warn('Failed to parse CSV:', error);
      return null;
    }
  };

  const prettyPrintXML = (xmlString: string): string => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        return xmlString; // Return original if parsing fails
      }

      // Simple XML formatting with indentation
      let formatted = '';
      let indent = 0;
      const tab = '  '; // 2 spaces

      // Remove all existing whitespace between tags
      const normalized = xmlString.replace(/>\s*</g, '><');

      // Split by tags
      const parts = normalized.split(/(<[^>]+>)/g).filter((part) => part.trim());

      for (const part of parts) {
        if (part.startsWith('</')) {
          // Closing tag
          indent = Math.max(0, indent - 1);
          formatted += `${tab.repeat(indent) + part}\n`;
        } else if (part.startsWith('<')) {
          // Opening tag or self-closing tag
          formatted += `${tab.repeat(indent) + part}\n`;
          if (!part.startsWith('<?') && !part.startsWith('<!') && !part.endsWith('/>')) {
            indent++;
          }
        } else {
          // Text content
          const trimmed = part.trim();
          if (trimmed) {
            formatted = `${formatted.trimEnd() + trimmed}\n`;
          }
        }
      }

      return formatted.trim();
    } catch (error) {
      console.warn('Failed to pretty-print XML:', error);
      return xmlString;
    }
  };

  const renderFormattedContent = () => {
    const lines = data.split('\n').filter((line) => line.trim());

    if (lines.length === 0) {
      return <div className="no-results">No results</div>;
    }

    // Handle CSV format
    if (format === 'csv') {
      const parsed = parseCSV(data);
      if (parsed) {
        return (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="results-table">
              <thead>
                <tr>
                  {parsed.headers.map((header) => (
                    <th key={`header-${header}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.rows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}-${row.join('-')}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`cell-${rowIndex}-${cellIndex}-${cell}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    // Handle SPARQL JSON format - pretty print it
    if (format === 'sparql-json') {
      try {
        const parsed = JSON.parse(data);
        return <pre className="json-output">{JSON.stringify(parsed, null, 2)}</pre>;
      } catch (_error) {
        // If JSON parsing fails, fall through to raw output
      }
    }

    // Check if data has pipe-separated table format (from backend)
    if (lines[0].includes('|')) {
      const rows = lines.map((line) =>
        line
          .split('|')
          .map((cell) => cell.trim())
          .filter((cell) => cell)
      );

      if (rows.length > 0) {
        const headers = rows[0];
        const dataRows = rows.slice(2);

        return (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="results-table">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={`header-${header}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}-${row.join('-')}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`cell-${rowIndex}-${cellIndex}-${cell}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    // Try to parse and pretty-print JSON-LD
    if (format === 'json-ld') {
      try {
        const parsed = JSON.parse(data);
        return <pre className="json-output">{JSON.stringify(parsed, null, 2)}</pre>;
      } catch (_error) {
        // If JSON parsing fails, fall through to raw output
      }
    }

    // Try to pretty-print SPARQL XML
    if (format === 'sparql-xml') {
      const prettyXML = prettyPrintXML(data);
      return <pre className="xml-output">{prettyXML}</pre>;
    }

    // Try to pretty-print Turtle/RDF
    if (format === 'turtle' || format === 'rdf-xml') {
      return <pre className="rdf-output">{data}</pre>;
    }

    // Default: render as raw output
    return <pre className="raw-output">{data}</pre>;
  };

  const renderRawContent = () => {
    return <pre className="raw-output">{data}</pre>;
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

        .view-mode-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          align-items: center;
        }

        .view-mode-toggle label {
          font-size: 14px;
          font-weight: 600;
          color: #475569;
        }

        .toggle-buttons {
          display: flex;
          gap: 0;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
        }

        .toggle-button {
          padding: 6px 16px;
          background: white;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s;
          border-right: 1px solid #e2e8f0;
        }

        .toggle-button:last-child {
          border-right: none;
        }

        .toggle-button:hover {
          background-color: #f8fafc;
        }

        .toggle-button.active {
          background-color: #3b82f6;
          color: white;
        }

        .toggle-button:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
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
          max-width: 400px;
          overflow-wrap: break-word;
        }

        .results-table tbody tr:hover {
          background-color: #f8fafc;
        }

        .results-table tbody tr:last-child td {
          border-bottom: none;
        }

        .json-output,
        .rdf-output,
        .raw-output {
          margin: 0;
          padding: 16px;
          background-color: #f8fafc;
          border-radius: 4px;
          overflow-x: auto;
          font-family: Monaco, Menlo, "Ubuntu Mono", Consolas, monospace;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .json-output {
          color: #1e293b;
        }

        .rdf-output {
          color: #0f766e;
        }

        .xml-output {
          color: #7c3aed;
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

      <div className="view-mode-toggle">
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>View:</span>
        <div className="toggle-buttons">
          <button
            type="button"
            className={`toggle-button ${viewMode === 'formatted' ? 'active' : ''}`}
            onClick={() => setViewMode('formatted')}
          >
            Formatted
          </button>
          <button
            type="button"
            className={`toggle-button ${viewMode === 'raw' ? 'active' : ''}`}
            onClick={() => setViewMode('raw')}
          >
            Raw
          </button>
        </div>
      </div>

      {viewMode === 'formatted' ? renderFormattedContent() : renderRawContent()}
    </div>
  );
};

export default ResultsTable;
