import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeEditor } from '../CodeEditor';

describe('CodeEditor', () => {
  it('renders without crashing', () => {
    const onChange = vi.fn();
    render(<CodeEditor value="" onChange={onChange} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('displays the provided value', () => {
    const onChange = vi.fn();
    const testValue = 'SELECT * WHERE { ?s ?p ?o }';
    render(<CodeEditor value={testValue} onChange={onChange} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe(testValue);
  });

  it('calls onChange when text is entered', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CodeEditor value="" onChange={onChange} />);
    const textarea = screen.getByRole('textbox');

    await user.type(textarea, 'test');

    expect(onChange).toHaveBeenCalled();
  });

  it('displays placeholder text', () => {
    const onChange = vi.fn();
    const placeholder = 'Enter your query here...';
    render(<CodeEditor value="" onChange={onChange} placeholder={placeholder} />);
    const textarea = screen.getByPlaceholderText(placeholder);
    expect(textarea).toBeInTheDocument();
  });

  it('respects readOnly prop', () => {
    const onChange = vi.fn();
    render(<CodeEditor value="test" onChange={onChange} readOnly={true} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.readOnly).toBe(true);
  });

  it('applies custom className', () => {
    const onChange = vi.fn();
    render(<CodeEditor value="" onChange={onChange} className="custom-editor" />);
    const container = document.querySelector('.code-editor');
    expect(container).toHaveClass('custom-editor');
  });

  it('applies custom minHeight', () => {
    const onChange = vi.fn();
    render(<CodeEditor value="" onChange={onChange} minHeight="500px" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveStyle({ minHeight: '500px' });
  });

  it('has correct default styles', () => {
    const onChange = vi.fn();
    render(<CodeEditor value="" onChange={onChange} />);
    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveStyle({
      width: '100%',
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
      fontSize: '14px',
      lineHeight: '1.5',
      padding: '12px',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      backgroundColor: '#f8fafc',
      color: '#1e293b',
    });
  });

  it('disables spell check', () => {
    const onChange = vi.fn();
    render(<CodeEditor value="" onChange={onChange} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.getAttribute('spellcheck')).toBe('false');
  });

  it('handles Tab key to insert spaces', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CodeEditor value="" onChange={onChange} />);
    const textarea = screen.getByRole('textbox');

    textarea.focus();
    await user.keyboard('{Tab}');

    expect(onChange).toHaveBeenCalledWith('  ');
  });

  it('handles Tab key in middle of text', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CodeEditor value="hello world" onChange={onChange} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    // Set cursor position in middle and focus
    textarea.focus();
    textarea.setSelectionRange(5, 5);

    // Simulate Tab key press
    await user.keyboard('{Tab}');

    // Should be called with the text with spaces inserted at cursor position
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toContain('hello');
  });

  it('accepts language prop (even if not used for syntax highlighting)', () => {
    const onChange = vi.fn();
    render(<CodeEditor value="" onChange={onChange} language="sparql" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('updates when value prop changes', () => {
    const onChange = vi.fn();
    const { rerender } = render(<CodeEditor value="initial" onChange={onChange} />);
    let textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('initial');

    rerender(<CodeEditor value="updated" onChange={onChange} />);
    textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('updated');
  });

  it('handles empty value', () => {
    const onChange = vi.fn();
    render(<CodeEditor value="" onChange={onChange} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
  });

  it('handles multiline text', () => {
    const onChange = vi.fn();
    const multilineText = 'Line 1\nLine 2\nLine 3';
    render(<CodeEditor value={multilineText} onChange={onChange} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe(multilineText);
  });
});
