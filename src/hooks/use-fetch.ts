import { useCallback, useEffect, useState } from 'react';

interface UseFetchOptions extends RequestInit {
  autoFetch?: boolean;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  fetched: boolean;
  fetchData: (url?: string) => Promise<any>;
}

function useFetch<T = unknown>(
  staticUrl?: string,
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const { autoFetch = true, ...fetchOptions } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState<boolean>(false);

  const fetchData = useCallback(
    async (url?: string) => {
      if (!url && !staticUrl) {
        throw new Error('Either url or staticUrl must be provided');
      }
      const urlToFetch = url || staticUrl;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(urlToFetch as string, fetchOptions);
        if (!response.ok) {
          const responseJson = await response.json();
          console.log(responseJson);
          throw new Error(responseJson.message);
        }
        const result: T = await response.json();
        setData(result);
        return result;
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
        setFetched(true);
      }
    },
    [staticUrl, fetchOptions]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return { data, loading, error, fetched, fetchData };
}

export default useFetch;
