'use client';

import React, { forwardRef, TextareaHTMLAttributes } from 'react';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'outlined' | 'filled';
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'outlined',
      fullWidth = false,
      resize = 'vertical',
      className = '',
      disabled = false,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'px-4 py-2 text-base font-poppins transition-all duration-200';
    
    const variantStyles = {
      outlined: 'border rounded-lg bg-transparent focus:outline-none focus:ring-2',
      filled: 'border-0 border-b-2 rounded-t-lg bg-[var(--hover)] focus:outline-none',
    };

    const resizeStyles = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
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
        <textarea
          ref={ref}
          disabled={disabled}
          rows={rows}
          className={`
            ${baseStyles}
            ${variantStyles[variant]}
            ${stateStyles}
            ${resizeStyles[resize]}
            ${fullWidth ? 'w-full' : ''}
            ${className}
          `}
          {...props}
        />
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

TextArea.displayName = 'TextArea';

export default TextArea;
