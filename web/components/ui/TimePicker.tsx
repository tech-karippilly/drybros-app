'use client';

import React, { forwardRef } from 'react';
import Input, { InputProps } from './Input';

export interface TimePickerProps extends Omit<InputProps, 'type'> {
  minTime?: string;
  maxTime?: string;
}

const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  ({ minTime, maxTime, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="time"
        min={minTime}
        max={maxTime}
        {...props}
      />
    );
  }
);

TimePicker.displayName = 'TimePicker';

export default TimePicker;
