import type { Prefix } from '@rdf-explorer/types';
import type React from 'react';
import { useState } from 'react';

export interface PrefixesListProps {
  prefixes: Prefix[];
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export const PrefixesList: React.FC<PrefixesListProps> = ({
  prefixes,
  isLoading = false,
  error,
  className = '',
}) => {
  const [copiedPrefix, setCopiedPrefix] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [format, setFormat] = useState<'rdf' | 'sparql'>('rdf');

  const formatPrefix = (prefix: Prefix, prefixFormat: 'rdf' | 'sparql'): string => {
    if (prefixFormat === 'sparql') {
      return `PREFIX ${prefix.prefix}: <${prefix.namespace}>`;
    }
    return `@prefix ${prefix.prefix}: <${prefix.namespace}> .`;
  };

  const handlePrefixClick = async (e: React.MouseEvent, prefix: Prefix) => {
    // Check for Ctrl (Windows/Linux) or Command (Mac) key
    if (e.ctrlKey || e.metaKey) {
      window.open(prefix.namespace, '_blank');
      return;
    }

    const prefixText = formatPrefix(prefix, format);
    try {
      await navigator.clipboard.writeText(prefixText);
      setCopiedPrefix(prefix.prefix);
      setTimeout(() => setCopiedPrefix(null), 2000);
    } catch (err) {
      console.error('Failed to copy prefix:', err);
    }
  };

  return (
    <div className={`prefixes-list-wrapper ${isExpanded ? '' : 'collapsed'} ${className}`}>
      <style>{`
        .prefixes-list-wrapper {
          position: relative;
          display: flex;
          justify-content: flex-end;
          align-items: flex-start;
        }

        .toggle-tab {
          position: sticky;
          top: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-right: none;
          border-radius: 8px 0 0 8px;
          padding: 8px 6px;
          cursor: pointer;
          box-shadow: -2px 0 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          z-index: 10;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          height: fit-content;
          flex-shrink: 0;
        }

        .toggle-tab:hover {
          background-color: #f8fafc;
          color: #475569;
        }

        .toggle-tab:active {
          background-color: #f1f5f9;
        }

        .toggle-icon {
          font-size: 14px;
          transition: transform 0.2s;
          writing-mode: horizontal-tb;
        }

        .toggle-tab.collapsed .toggle-icon {
          transform: rotate(180deg);
        }

        .prefixes-list-container {
          transition: all 0.3s ease-out;
          overflow: hidden;
        }

        .prefixes-list-wrapper.collapsed .prefixes-list-container {
          width: 0;
        }

        .prefixes-list {
          background: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          width: 320px;
          height: fit-content;
          border: 1px solid #e2e8f0;
          transition: opacity 0.3s ease-out;
          border-left: none;
          border-radius: 0 8px 8px 0;
        }

        .prefixes-list-wrapper.collapsed .prefixes-list {
          opacity: 0;
          pointer-events: none;
        }

        .prefixes-header {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .format-toggle-container {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding: 8px;
          background-color: #f8fafc;
          border-radius: 6px;
        }

        .format-toggle-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }

        .format-toggle-buttons {
          display: flex;
          gap: 4px;
          background-color: white;
          border-radius: 4px;
          padding: 2px;
          border: 1px solid #e2e8f0;
        }

        .format-toggle-button {
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.2s;
        }

        .format-toggle-button:hover {
          color: #475569;
          background-color: #f8fafc;
        }

        .format-toggle-button.active {
          background-color: #3b82f6;
          color: white;
        }

        .prefixes-description {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 12px;
          font-style: italic;
        }

        .prefixes-container {
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background-color: #f8fafc;
        }

        .prefixes-container::-webkit-scrollbar {
          width: 8px;
        }

        .prefixes-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .prefixes-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .prefixes-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .prefix-item {
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          border: none;
          border-bottom: 1px solid #e2e8f0;
          background: transparent;
          cursor: pointer;
          transition: background-color 0.2s;
          position: relative;
        }

        .prefix-item:last-child {
          border-bottom: none;
        }

        .prefix-item:hover {
          background-color: #f1f5f9;
        }

        .prefix-item:active {
          background-color: #e2e8f0;
        }

        .prefix-text {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
          font-size: 13px;
          color: #1e293b;
          word-break: break-all;
          line-height: 1.5;
        }

        .prefix-name {
          color: #3b82f6;
          font-weight: 600;
        }

        .prefix-namespace {
          color: #059669;
        }

        .copy-indicator {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          background-color: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          pointer-events: none;
          animation: fadeIn 0.2s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
        }

        .loading-state {
          text-align: center;
          padding: 32px;
          color: #64748b;
        }

        .loading-spinner {
          display: inline-block;
          width: 24px;
          height: 24px;
          border: 3px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .error-state {
          padding: 16px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #991b1b;
          font-size: 13px;
        }

        .empty-state {
          text-align: center;
          padding: 32px;
          color: #64748b;
          font-size: 13px;
        }

        .prefix-count {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          margin-top: 8px;
        }
      `}</style>

      <button
        type="button"
        className={`toggle-tab ${isExpanded ? '' : 'collapsed'}`}
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Hide prefixes' : 'Show prefixes'}
      >
        <span className="toggle-icon">{isExpanded ? '◄' : '►'}</span>
      </button>

      <div className={`prefixes-list-container ${isExpanded ? '' : 'collapsed'}`}>
        <div className="prefixes-list">
          <h3 className="prefixes-header">
            <span>📋</span>
            Available Prefixes
          </h3>

          <div className="format-toggle-container">
            <span className="format-toggle-label">Format:</span>
            <div className="format-toggle-buttons">
              <button
                type="button"
                className={`format-toggle-button ${format === 'rdf' ? 'active' : ''}`}
                onClick={() => setFormat('rdf')}
                title="RDF/Turtle format"
              >
                RDF
              </button>
              <button
                type="button"
                className={`format-toggle-button ${format === 'sparql' ? 'active' : ''}`}
                onClick={() => setFormat('sparql')}
                title="SPARQL format"
              >
                SPARQL
              </button>
            </div>
          </div>

          <p className="prefixes-description">
            Click to copy prefix declaration. Ctrl+Click to open URL.
          </p>

          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p style={{ marginTop: '12px', fontSize: '13px' }}>Loading prefixes...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="error-state">
              <strong>Error:</strong> {error}
            </div>
          )}

          {!isLoading && !error && prefixes.length === 0 && (
            <div className="empty-state">No prefixes available</div>
          )}

          {!isLoading && !error && prefixes.length > 0 && (
            <>
              <div className="prefixes-container">
                {prefixes.map((prefix) => (
                  <button
                    type="button"
                    key={prefix.prefix}
                    className="prefix-item"
                    onClick={(e) => handlePrefixClick(e, prefix)}
                    title={`Click to copy: ${formatPrefix(prefix, format)}\nCtrl+Click to open URL`}
                  >
                    <div className="prefix-text">
                      {format === 'rdf' ? (
                        <>
                          <span className="prefix-name">@prefix {prefix.prefix}:</span>{' '}
                          <span className="prefix-namespace">&lt;{prefix.namespace}&gt;</span> .
                        </>
                      ) : (
                        <>
                          <span className="prefix-name">PREFIX {prefix.prefix}:</span>{' '}
                          <span className="prefix-namespace">&lt;{prefix.namespace}&gt;</span>
                        </>
                      )}
                    </div>
                    {copiedPrefix === prefix.prefix && (
                      <span className="copy-indicator">✓ Copied!</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="prefix-count">
                {prefixes.length} {prefixes.length === 1 ? 'prefix' : 'prefixes'} available
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrefixesList;
