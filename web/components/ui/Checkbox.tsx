'use client';

import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  indeterminate?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, indeterminate = false, className = '', disabled = false, ...props }, ref) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    React.useImperativeHandle(ref, () => checkboxRef.current!);

    return (
      <div className="flex flex-col">
        <label className="flex items-center cursor-pointer group">
          <div className="relative flex items-center">
            <input
              ref={checkboxRef}
              type="checkbox"
              disabled={disabled}
              className={`
                appearance-none w-5 h-5 border-2 rounded 
                transition-all duration-200
                ${
                  disabled
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                    : error
                    ? 'border-[var(--error)] focus:ring-2 focus:ring-[var(--error)]'
                    : 'border-[var(--border)] hover:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]'
                }
                checked:bg-[var(--primary)] checked:border-[var(--primary)]
                focus:outline-none
                ${className}
              `}
              {...props}
            />
            <svg
              className={`
                absolute left-0.5 w-4 h-4 pointer-events-none
                transition-opacity duration-200
                ${props.checked ? 'opacity-100' : 'opacity-0'}
              `}
              viewBox="0 0 16 16"
              fill="white"
            >
              {indeterminate ? (
                <rect x="3" y="7" width="10" height="2" />
              ) : (
                <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
              )}
            </svg>
          </div>
          {label && (
            <span
              className={`ml-2 text-sm font-poppins ${
                disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : error
                  ? 'text-[var(--error)]'
                  : 'text-[var(--foreground)] group-hover:text-[var(--primary)]'
              }`}
            >
              {label}
            </span>
          )}
        </label>
        {error && <p className="mt-1 text-xs text-[var(--error)]">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
