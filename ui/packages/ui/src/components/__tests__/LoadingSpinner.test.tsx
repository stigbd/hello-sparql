import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with default medium size', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.spinner');
    expect(spinner).toHaveStyle({ width: '40px', height: '40px' });
  });

  it('renders with small size', () => {
    render(<LoadingSpinner size="small" />);
    const spinner = document.querySelector('.spinner');
    expect(spinner).toHaveStyle({ width: '20px', height: '20px' });
  });

  it('renders with large size', () => {
    render(<LoadingSpinner size="large" />);
    const spinner = document.querySelector('.spinner');
    expect(spinner).toHaveStyle({ width: '60px', height: '60px' });
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    const container = document.querySelector('.loading-spinner');
    expect(container).toHaveClass('custom-class');
  });

  it('has correct animation styles', () => {
    render(<LoadingSpinner />);
    const style = document.querySelector('style');
    expect(style?.textContent).toContain('@keyframes spin');
    expect(style?.textContent).toContain('animation: spin 1s linear infinite');
  });

  it('has correct border styles for spinner', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.spinner');
    expect(spinner).toHaveStyle({
      borderRadius: '50%',
    });
  });
});
