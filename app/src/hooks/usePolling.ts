import { useState, useEffect, useRef } from 'react';

interface PollingState<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
}

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs = 30000,
): PollingState<T> {
  const [state, setState] = useState<PollingState<T>>({ data: null, loading: true, error: false });
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    mountedRef.current = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const fetchData = async () => {
      try {
        const data = await fetcherRef.current();
        if (mountedRef.current) setState({ data, loading: false, error: false });
      } catch {
        if (mountedRef.current) setState(s => ({ ...s, loading: false, error: true }));
      }
    };

    fetchData();

    const schedule = () => {
      timeoutId = setTimeout(async () => {
        await fetchData();
        if (mountedRef.current) schedule();
      }, intervalMs);
    };

    schedule();

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
    };
  }, [intervalMs]);

  return state;
}
