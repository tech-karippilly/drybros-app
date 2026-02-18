'use client';

import React, { forwardRef } from 'react';
import Input, { InputProps } from './Input';

export interface DatePickerProps extends Omit<InputProps, 'type'> {
  minDate?: string;
  maxDate?: string;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ minDate, maxDate, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="date"
        min={minDate}
        max={maxDate}
        {...props}
      />
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;
