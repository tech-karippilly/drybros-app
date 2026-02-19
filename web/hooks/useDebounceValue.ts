import { useEffect, useState } from 'react';

/**
 * Custom hook for debouncing a value
 * @param value - Value to debounce
 * @param delay - Debounce delay in milliseconds (default: 500ms)
 * @returns Debounced value
 */
export function useDebounceValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}