import type React from 'react';
import { useRef, useEffect } from 'react';

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
  language: _language = 'turtle', // Reserved for future syntax highlighting feature
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = `${value.substring(0, start)}  ${value.substring(end)}`;
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
