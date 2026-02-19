import type React from 'react';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  className = '',
}) => {
  const sizeMap = {
    small: '20px',
    medium: '40px',
    large: '60px',
  };

  const spinnerSize = sizeMap[size];

  return (
    <div className={`loading-spinner ${className}`}>
      <style>{`
        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .spinner {
          border: 3px solid #f3f4f6;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div
        className="spinner"
        style={{
          width: spinnerSize,
          height: spinnerSize,
        }}
      />
    </div>
  );
};

export default LoadingSpinner;
