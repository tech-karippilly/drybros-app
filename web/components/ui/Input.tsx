'use client';

import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  variant?: 'outlined' | 'filled' | 'standard';
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      startIcon,
      endIcon,
      variant = 'outlined',
      fullWidth = false,
      className = '',
      disabled = false,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'px-4 py-2 text-base font-poppins transition-all duration-200';
    
    const variantStyles = {
      outlined: 'border rounded-lg bg-transparent focus:outline-none focus:ring-2',
      filled: 'border-0 border-b-2 rounded-t-lg bg-[var(--hover)] focus:outline-none',
      standard: 'border-0 border-b-2 bg-transparent focus:outline-none',
    };

    const stateStyles = error
      ? 'border-[var(--error)] focus:ring-[var(--error)] text-[var(--error)]'
      : disabled
      ? 'border-[var(--border)] bg-gray-100 cursor-not-allowed opacity-60'
      : 'border-[var(--border)] focus:ring-[var(--primary)] focus:border-[var(--primary)] text-[var(--foreground)]';

    return (
      <div className={`flex flex-col ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="mb-2 text-sm font-medium text-[var(--foreground)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute left-3 text-[var(--foreground)] opacity-60">
              {startIcon}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            className={`
              ${baseStyles}
              ${variantStyles[variant]}
              ${stateStyles}
              ${startIcon ? 'pl-10' : ''}
              ${endIcon ? 'pr-10' : ''}
              ${fullWidth ? 'w-full' : ''}
              ${className}
            `}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 text-[var(--foreground)] opacity-60">
              {endIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p
            className={`mt-1 text-xs ${
              error ? 'text-[var(--error)]' : 'text-[var(--foreground)] opacity-60'
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
