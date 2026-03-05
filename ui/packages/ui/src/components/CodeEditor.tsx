import Prism from 'prismjs';
import type React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
// Import theme
import 'prismjs/themes/prism-okaidia.css';
// Import languages
import 'prismjs/components/prism-turtle';
import 'prismjs/components/prism-sparql';

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  minHeight?: string;
  maxHeight?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'turtle',
  placeholder = '',
  readOnly = false,
  className = '',
  minHeight = '300px',
  maxHeight = '600px',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [highlightedCode, setHighlightedCode] = useState('');

  // Map language names to Prism identifiers
  const getPrismLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      turtle: 'turtle',
      sparql: 'sparql',
      ttl: 'turtle',
      rdf: 'turtle',
    };
    return languageMap[lang.toLowerCase()] || 'turtle';
  };

  const prismLanguage = getPrismLanguage(language);

  // Highlight the code using Prism
  useEffect(() => {
    const highlight = () => {
      try {
        if (value) {
          const grammar = Prism.languages[prismLanguage];
          if (grammar) {
            const highlighted = Prism.highlight(value, grammar, prismLanguage);
            console.log('Prism highlighted code:', `${highlighted.substring(0, 100)}...`);
            setHighlightedCode(highlighted);
          } else {
            console.warn('Grammar not found for language:', prismLanguage);
            setHighlightedCode(value);
          }
        } else {
          setHighlightedCode('');
        }
      } catch (error) {
        console.warn('Syntax highlighting error:', error);
        setHighlightedCode(value);
      }
    };

    highlight();
  }, [value, prismLanguage]);

  // Auto-resize editor
  // biome-ignore lint/correctness/useExhaustiveDependencies: value affects scrollHeight indirectly through textarea content
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Store scroll position to prevent jumping
      const currentScrollTop = textarea.scrollTop;

      textarea.style.height = 'auto';

      const scrollHeight = textarea.scrollHeight;
      const maxH = Number.parseInt(maxHeight.replace('px', ''), 10);

      if (!Number.isNaN(maxH) && scrollHeight > maxH) {
        textarea.style.height = `${maxH}px`;
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = 'hidden';
      }

      // Restore scroll position
      if (currentScrollTop > 0) {
        textarea.scrollTop = currentScrollTop;
      }
    }
  }, [value, maxHeight]);

  // Sync scroll between textarea and pre element
  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

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
    <div className={`code-editor ${className}`} style={{ position: 'relative', minHeight }}>
      {/* Syntax highlighted overlay - must render first (background layer) */}
      <pre
        ref={preRef}
        className={`language-${prismLanguage}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          padding: '12px',
          minHeight,
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          border: '1px solid transparent',
          borderRadius: '6px',
          backgroundColor: '#272822',
          overflow: 'hidden',
          pointerEvents: 'none',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
        aria-hidden="true"
      >
        <code
          className={`language-${prismLanguage}`}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for Prism syntax highlighting
          dangerouslySetInnerHTML={{
            __html: highlightedCode || `<span style="color: #75715e">${placeholder}</span>`,
          }}
        />
      </pre>

      {/* Textarea for user input - renders on top with transparent text */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        placeholder={placeholder}
        readOnly={readOnly}
        spellCheck={false}
        className="code-editor-textarea"
        style={{
          position: 'relative',
          minHeight,
          width: '100%',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          padding: '12px',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          backgroundColor: 'transparent',
          color: 'transparent',
          caretColor: '#f8f8f2',
          resize: 'none',
          outline: 'none',
          boxSizing: 'border-box',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
      />

      <style>{`
        .code-editor {
          position: relative;
        }

        .code-editor textarea::selection {
          background-color: rgba(255, 255, 255, 0.2);
          color: transparent;
        }

        .code-editor textarea::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        .code-editor textarea::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 6px;
        }

        .code-editor textarea::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 6px;
        }

        .code-editor textarea::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .code-editor pre::-webkit-scrollbar {
          display: none;
        }

        .code-editor textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
};

export default CodeEditor;
