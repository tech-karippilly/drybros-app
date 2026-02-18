'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  rounded?: boolean;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'contained',
      color = 'primary',
      size = 'medium',
      fullWidth = false,
      startIcon,
      endIcon,
      rounded = false,
      loading = false,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'font-poppins font-semibold transition-all duration-200 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2';

    const sizeStyles = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-4 py-2 text-base',
      large: 'px-6 py-3 text-lg',
    };

    const variantStyles = {
      contained: {
        primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] focus:ring-[var(--primary)]',
        secondary: 'bg-[var(--secondary)] text-white hover:bg-[var(--secondary-dark)] focus:ring-[var(--secondary)]',
        success: 'bg-[var(--success)] text-white hover:opacity-90 focus:ring-[var(--success)]',
        error: 'bg-[var(--error)] text-white hover:opacity-90 focus:ring-[var(--error)]',
        warning: 'bg-[var(--warning)] text-white hover:opacity-90 focus:ring-[var(--warning)]',
        info: 'bg-[var(--info)] text-white hover:opacity-90 focus:ring-[var(--info)]',
      },
      outlined: {
        primary: 'border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white focus:ring-[var(--primary)]',
        secondary: 'border-2 border-[var(--secondary)] text-[var(--secondary)] hover:bg-[var(--secondary)] hover:text-white focus:ring-[var(--secondary)]',
        success: 'border-2 border-[var(--success)] text-[var(--success)] hover:bg-[var(--success)] hover:text-white focus:ring-[var(--success)]',
        error: 'border-2 border-[var(--error)] text-[var(--error)] hover:bg-[var(--error)] hover:text-white focus:ring-[var(--error)]',
        warning: 'border-2 border-[var(--warning)] text-[var(--warning)] hover:bg-[var(--warning)] hover:text-white focus:ring-[var(--warning)]',
        info: 'border-2 border-[var(--info)] text-[var(--info)] hover:bg-[var(--info)] hover:text-white focus:ring-[var(--info)]',
      },
      text: {
        primary: 'text-[var(--primary)] hover:bg-[var(--primary)] hover:bg-opacity-10 focus:ring-[var(--primary)]',
        secondary: 'text-[var(--secondary)] hover:bg-[var(--secondary)] hover:bg-opacity-10 focus:ring-[var(--secondary)]',
        success: 'text-[var(--success)] hover:bg-[var(--success)] hover:bg-opacity-10 focus:ring-[var(--success)]',
        error: 'text-[var(--error)] hover:bg-[var(--error)] hover:bg-opacity-10 focus:ring-[var(--error)]',
        warning: 'text-[var(--warning)] hover:bg-[var(--warning)] hover:bg-opacity-10 focus:ring-[var(--warning)]',
        info: 'text-[var(--info)] hover:bg-[var(--info)] hover:bg-opacity-10 focus:ring-[var(--info)]',
      },
    };

    const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none';

    const LoadingSpinner = () => (
      <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          ${baseStyles}
          ${sizeStyles[size]}
          ${variantStyles[variant]?.[color] || variantStyles.contained.primary}
          ${rounded ? 'rounded-full' : 'rounded-lg'}
          ${fullWidth ? 'w-full' : ''}
          ${disabled || loading ? disabledStyles : ''}
          ${className}
        `}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {!loading && startIcon && <span className="mr-2">{startIcon}</span>}
        {children}
        {!loading && endIcon && <span className="ml-2">{endIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
