import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';

export function useApi(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const paramsKey = JSON.stringify(options.params);

  const fetch = useCallback(async (signal) => {
    try {
      setLoading(true);
      const res = await api.get(url, { params: options.params, signal });
      setData(res.data);
      setError(null);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setError(err.response?.data || err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [url, paramsKey]);

  useEffect(() => {
    if (options.lazy) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    fetch(controller.signal);
    return () => controller.abort();
  }, [fetch, options.lazy]);

  return { data, loading, error, refetch: fetch };
}
