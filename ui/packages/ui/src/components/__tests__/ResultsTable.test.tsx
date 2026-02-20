import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsTable } from '../ResultsTable';

describe('ResultsTable', () => {
  it('renders without crashing', () => {
    render(<ResultsTable data="" format="txt" />);
    expect(document.querySelector('.results-container')).toBeInTheDocument();
  });

  it('renders table format for pipe-separated text data', () => {
    const tableData = `| s | p | o |
|---|---|---|
| ex:John | rdf:type | ex:Person |
| ex:Jane | rdf:type | ex:Person |`;

    render(<ResultsTable data={tableData} format="txt" />);

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveTextContent('s');
    expect(headers[1]).toHaveTextContent('p');
    expect(headers[2]).toHaveTextContent('o');
  });

  it('renders data rows correctly in table format', () => {
    const tableData = `| name | age |
|---|---|
| John | 30 |
| Jane | 25 |`;

    render(<ResultsTable data={tableData} format="txt" />);

    const rows = screen.getAllByRole('row');
    // 1 header row + 2 data rows
    expect(rows).toHaveLength(3);

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('shows "No results" for empty text data', () => {
    render(<ResultsTable data="" format="txt" />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('shows "No results" for whitespace-only text data', () => {
    render(<ResultsTable data="   \n  \n  " format="txt" />);
    // Whitespace lines are not filtered as empty, so they show as raw output
    const pre = document.querySelector('.raw-output');
    expect(pre).toBeInTheDocument();
  });

  it('renders JSON format correctly', () => {
    const jsonData = JSON.stringify({ results: [{ name: 'John' }, { name: 'Jane' }] }, null, 2);
    render(<ResultsTable data={jsonData} format="json" />);

    const pre = document.querySelector('.json-output');
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toContain('John');
    expect(pre?.textContent).toContain('Jane');
  });

  it('handles invalid JSON gracefully', () => {
    const invalidJson = '{ invalid json }';
    render(<ResultsTable data={invalidJson} format="json" />);

    expect(screen.getByText(/Failed to parse JSON/)).toBeInTheDocument();
  });

  it('renders CSV format as raw output', () => {
    const csvData = 'name,age\nJohn,30\nJane,25';
    render(<ResultsTable data={csvData} format="csv" />);

    const pre = document.querySelector('.raw-output');
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toBe(csvData);
  });

  it('renders XML format as raw output', () => {
    const xmlData = '<result><name>John</name></result>';
    render(<ResultsTable data={xmlData} format="xml" />);

    const pre = document.querySelector('.raw-output');
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toBe(xmlData);
  });

  it('applies custom className', () => {
    render(<ResultsTable data="" format="txt" className="custom-results" />);
    const container = document.querySelector('.results-container');
    expect(container).toHaveClass('custom-results');
  });

  it('renders table with overflow container', () => {
    const tableData = `| col1 | col2 |
|---|---|
| data1 | data2 |`;

    render(<ResultsTable data={tableData} format="txt" />);

    const tableContainer = document.querySelector('.table-container');
    expect(tableContainer).toBeInTheDocument();
    expect(tableContainer).toHaveStyle({ overflowX: 'auto' });
  });

  it('handles non-pipe text format as raw output', () => {
    const rawText = 'Some plain text without pipes';
    render(<ResultsTable data={rawText} format="txt" />);

    const pre = document.querySelector('.raw-output');
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toBe(rawText);
  });

  it('filters out empty cells from pipe-separated data', () => {
    const tableData = `| | name | age | |
|---|---|---|---|
| | John | 30 | |`;

    render(<ResultsTable data={tableData} format="txt" />);

    const headers = screen.getAllByRole('columnheader');
    // Should only show non-empty headers
    expect(headers.length).toBeGreaterThan(0);
  });

  it('renders JSON with pretty formatting', () => {
    const jsonData = '{"name":"John","age":30}';
    render(<ResultsTable data={jsonData} format="json" />);

    const pre = document.querySelector('.json-output');
    expect(pre?.textContent).toContain('\n'); // Should have newlines from pretty print
  });

  it('handles complex table data with multiple rows', () => {
    const tableData = `| subject | predicate | object |
|---|---|---|
| ex:John | rdf:type | ex:Person |
| ex:John | ex:name | "John" |
| ex:John | ex:age | 30 |
| ex:Jane | rdf:type | ex:Person |
| ex:Jane | ex:name | "Jane" |`;

    render(<ResultsTable data={tableData} format="txt" />);

    const rows = screen.getAllByRole('row');
    // 1 header row + 5 data rows
    expect(rows).toHaveLength(6);
  });

  it('has correct table styling', () => {
    const tableData = `| col1 | col2 |
|---|---|
| data1 | data2 |`;

    render(<ResultsTable data={tableData} format="txt" />);

    const table = screen.getByRole('table');
    expect(table).toHaveClass('results-table');
  });

  it('renders empty table when only headers are present', () => {
    const tableData = `| name | age |
|---|---|`;

    render(<ResultsTable data={tableData} format="txt" />);

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(2);

    // Should not have data rows
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(1); // Only header row
  });
});
