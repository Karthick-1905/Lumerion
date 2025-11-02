import { useCallback, useEffect, useMemo, useRef } from "react";

export function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  wait = 300
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      if (lastArgsRef.current) {
        fn(...lastArgsRef.current);
      }
    }
  }, [fn]);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args;
      cancel();
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        if (lastArgsRef.current) {
          fn(...lastArgsRef.current);
        }
      }, wait);
    },
    [fn, wait, cancel]
  );

  useEffect(() => () => cancel(), [cancel]);

  return useMemo(
    () => Object.assign(debounced, { cancel, flush }),
    [debounced, cancel, flush]
  );
}

export default useDebouncedCallback;
