import { useEffect, useRef } from 'react';

/**
 * Custom hook for debouncing socket events
 * @param callback - Function to call after debounce delay
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced callback function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef<T>(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Return debounced function
  return useRef((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }).current as T;
}

/**
 * Custom hook for handling socket event debouncing
 * @param eventHandler - Socket event handler function
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced event handler
 */
export function useSocketEventDebounce<T>(
  eventHandler: (data: T) => void,
  delay: number = 500
): (data: T) => void {
  return useDebounce(eventHandler, delay);
}