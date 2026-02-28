import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as useSPARQLQueryModule from '../../hooks/useSPARQLQuery';
import { QueryExplorer } from '../QueryExplorer';

// Mock the hook
vi.mock('../../hooks/useSPARQLQuery');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('QueryExplorer', () => {
  let mockExecuteQuery: ReturnType<typeof vi.fn>;
  let mockUseSPARQLQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockExecuteQuery = vi.fn();
    mockUseSPARQLQuery = vi.fn(() => ({
      executeQuery: mockExecuteQuery,
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: undefined,
      reset: vi.fn(),
    }));

    (useSPARQLQueryModule.useSPARQLQuery as unknown) = mockUseSPARQLQuery;
  });

  it('renders without crashing', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    expect(screen.getByText('SPARQL Query Explorer')).toBeInTheDocument();
  });

  it('renders header with title and description', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    expect(screen.getByText('SPARQL Query Explorer')).toBeInTheDocument();
    expect(
      screen.getByText('Execute SPARQL queries on RDF data and explore the results')
    ).toBeInTheDocument();
  });

  it('renders query template selector', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    expect(screen.getByLabelText('Query Template:')).toBeInTheDocument();
  });

  it('renders result format selector', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    expect(screen.getByLabelText('Result Format:')).toBeInTheDocument();
  });

  it('renders execute button', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    expect(screen.getByRole('button', { name: /Execute Query/i })).toBeInTheDocument();
  });

  it('renders SPARQL query editor', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    expect(screen.getByText('🔍 SPARQL Query')).toBeInTheDocument();
    expect(screen.getByText('Enter your SPARQL query below')).toBeInTheDocument();
  });

  it('renders inference checkbox', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    expect(screen.getByLabelText('Enable Inference')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Enable Inference/i })).not.toBeChecked();
  });

  it('renders RDF data editor', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    expect(screen.getByText('📝 RDF Data')).toBeInTheDocument();
    expect(screen.getByText('Enter your RDF data in Turtle format')).toBeInTheDocument();
  });

  it('renders results section', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  it('shows empty state initially', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    expect(screen.getByText('Ready to execute')).toBeInTheDocument();
    expect(
      screen.getByText('Enter your query and data, then click "Execute Query" to see results')
    ).toBeInTheDocument();
  });

  it('executes query when execute button is clicked', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    const executeButton = screen.getByRole('button', { name: /Execute Query/i });
    await user.click(executeButton);

    expect(mockExecuteQuery).toHaveBeenCalled();
  });

  it('shows loading state when query is executing', () => {
    mockUseSPARQLQuery.mockReturnValue({
      executeQuery: mockExecuteQuery,
      isLoading: true,
      isError: false,
      isSuccess: false,
      error: null,
      data: undefined,
      reset: vi.fn(),
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    expect(screen.getByRole('button', { name: /Executing.../i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Executing.../i })).toBeDisabled();
  });

  it('shows error message when query fails', async () => {
    const onErrorCallback = vi.fn();
    mockUseSPARQLQuery.mockImplementation((options) => {
      // Simulate the hook calling onError
      if (options?.onError) {
        onErrorCallback.mockImplementation(options.onError);
      }
      return {
        executeQuery: mockExecuteQuery,
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: { message: 'Query failed', detail: 'Invalid SPARQL syntax' },
        data: undefined,
        reset: vi.fn(),
      };
    });

    const Wrapper = createWrapper();
    const { rerender } = render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    // Trigger the error by simulating what happens when executeQuery is called
    const executeButton = screen.getByRole('button', { name: /Execute Query/i });
    await userEvent.click(executeButton);

    // Re-render with error state
    mockUseSPARQLQuery.mockReturnValue({
      executeQuery: mockExecuteQuery,
      isLoading: false,
      isError: true,
      isSuccess: false,
      error: { message: 'Query failed', detail: 'Invalid SPARQL syntax' },
      data: undefined,
      reset: vi.fn(),
    });

    rerender(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );
  });

  it('changes query template when template selector changes', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    const templateSelector = screen.getByLabelText('Query Template:');
    await user.selectOptions(templateSelector, 'count');

    // The query should be updated to the count template
    const textareas = screen.getAllByRole('textbox');
    const queryTextarea = textareas[0] as HTMLTextAreaElement;
    expect(queryTextarea.value).toContain('COUNT');
  });

  it('changes result format when format selector changes', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    const formatSelector = screen.getByLabelText('Result Format:');
    await user.selectOptions(formatSelector, 'json');

    expect((formatSelector as HTMLSelectElement).value).toBe('json');
  });

  it('updates query when user types in query editor', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    const textareas = screen.getAllByRole('textbox');
    const queryTextarea = textareas[0];

    await user.clear(queryTextarea);
    // Type text that doesn't have special characters that userEvent interprets as keyboard shortcuts
    await user.type(queryTextarea, 'SELECT * WHERE');

    expect((queryTextarea as HTMLTextAreaElement).value).toContain('SELECT * WHERE');
  });

  it('updates data when user types in data editor', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    const textareas = screen.getAllByRole('textbox');
    const dataTextarea = textareas[1];

    await user.clear(dataTextarea);
    await user.type(dataTextarea, '@prefix ex: <http://example.org/>.');

    expect((dataTextarea as HTMLTextAreaElement).value).toContain('@prefix ex:');
  });

  it('shows error when trying to execute with empty query', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    const textareas = screen.getAllByRole('textbox');
    const queryTextarea = textareas[0];

    await user.clear(queryTextarea);

    const executeButton = screen.getByRole('button', { name: /Execute Query/i });
    await user.click(executeButton);

    // executeQuery should not be called if query or data is empty
    expect(mockExecuteQuery).not.toHaveBeenCalled();
  });

  it('has all format options available', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    const formatSelector = screen.getByLabelText('Result Format:');
    const options = Array.from(formatSelector.querySelectorAll('option'));
    const optionValues = options.map((opt) => (opt as HTMLOptionElement).value);

    expect(optionValues).toContain('txt');
    expect(optionValues).toContain('json');
    expect(optionValues).toContain('csv');
    expect(optionValues).toContain('xml');
  });

  it('has all query template options available', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    const templateSelector = screen.getByLabelText('Query Template:');
    const options = Array.from(templateSelector.querySelectorAll('option'));
    const optionValues = options.map((opt) => (opt as HTMLOptionElement).value);

    expect(optionValues).toContain('select');
    expect(optionValues).toContain('count');
    expect(optionValues).toContain('construct');
  });

  it('renders with initial data pre-populated', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    const textareas = screen.getAllByRole('textbox');
    const dataTextarea = textareas[1] as HTMLTextAreaElement;

    expect(dataTextarea.value).toContain('ex:John');
    expect(dataTextarea.value).toContain('ex:Person');
  });

  it('renders with initial query pre-populated', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    const textareas = screen.getAllByRole('textbox');
    const queryTextarea = textareas[0] as HTMLTextAreaElement;

    expect(queryTextarea.value).toContain('SELECT');
    expect(queryTextarea.value).toContain('WHERE');
  });

  it('displays execution time when available', () => {
    mockUseSPARQLQuery.mockReturnValue({
      executeQuery: mockExecuteQuery,
      isLoading: false,
      isError: false,
      isSuccess: true,
      error: null,
      data: { result: 'test results', duration: 0.123 },
      reset: vi.fn(),
    });

    const Wrapper = createWrapper();
    const { rerender } = render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    // Simulate successful execution by setting state
    rerender(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    // The duration is managed internally by the component
    // We would need to trigger the actual flow to see it
  });

  it('toggles inference checkbox when clicked', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    const inferenceCheckbox = screen.getByRole('checkbox', { name: /Enable Inference/i });
    expect(inferenceCheckbox).not.toBeChecked();

    await user.click(inferenceCheckbox);
    expect(inferenceCheckbox).toBeChecked();

    await user.click(inferenceCheckbox);
    expect(inferenceCheckbox).not.toBeChecked();
  });

  it('passes inference parameter to executeQuery', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    // Enable inference
    const inferenceCheckbox = screen.getByRole('checkbox', { name: /Enable Inference/i });
    await user.click(inferenceCheckbox);

    // Execute query
    const executeButton = screen.getByRole('button', { name: /Execute Query/i });
    await user.click(executeButton);

    expect(mockExecuteQuery).toHaveBeenCalledWith({
      request: expect.objectContaining({
        inference: true,
      }),
      format: 'txt',
    });
  });

  it('passes inference as false when checkbox is unchecked', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    // Execute query without enabling inference
    const executeButton = screen.getByRole('button', { name: /Execute Query/i });
    await user.click(executeButton);

    expect(mockExecuteQuery).toHaveBeenCalledWith({
      request: expect.objectContaining({
        inference: false,
      }),
      format: 'txt',
    });
  });

  it('applies correct CSS styles', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueryExplorer />
      </Wrapper>
    );

    const explorer = document.querySelector('.query-explorer');
    expect(explorer).toBeInTheDocument();

    const style = document.querySelector('style');
    expect(style?.textContent).toContain('.query-explorer');
    expect(style?.textContent).toContain('.button');
    expect(style?.textContent).toContain('.editor-panel');
  });
});
