'use client';
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This ensures we don't run the debounce logic on the initial server render
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run the debounce if the component is mounted on the client
    if (isMounted) {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [value, delay, isMounted]);

  // On server-side and initial client-side render, return the value directly.
  // The debounced value will kick in only after the initial mount.
  return isMounted ? debouncedValue : value;
}
