import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';

export function useApi(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const paramsRef = useRef(options.params);
  paramsRef.current = options.params;

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(url, { params: paramsRef.current });
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!options.lazy) fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
