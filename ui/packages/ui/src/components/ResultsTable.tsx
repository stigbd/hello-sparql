import type React from 'react';

export interface ResultsTableProps {
  data: string;
  format: 'txt' | 'json' | 'csv' | 'xml';
  className?: string;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ data, format, className = '' }) => {
  const renderContent = () => {
    if (format === 'txt') {
      const lines = data.split('\n').filter((line) => line.trim());
      if (lines.length === 0) {
        return <div className="no-results">No results</div>;
      }

      if (lines[0].includes('|')) {
        const rows = lines.map((line) =>
          line
            .split('|')
            .map((cell) => cell.trim())
            .filter((cell) => cell)
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
                  {headers.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}-${row[0]}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${headers[cellIndex]}-${cellIndex}`}>{cell}</td>
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
        return <pre className="json-output">{JSON.stringify(parsed, null, 2)}</pre>;
      } catch (error) {
        return (
          <div className="error-message">
            Failed to parse JSON: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        );
      }
    }

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
