import { useState, useEffect, useCallback } from 'react';
import { masterApi } from '../lib/api.js';

let cachedMasterBundle = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function useMasterData(options = {}) {
  const { forceRefresh = false } = options;
  const [data, setData] = useState(() => cachedMasterBundle || {
    verticals: [],
    sbus: [],
    clients: [],
    locations: [],
  });
  const [isLoading, setIsLoading] = useState(!cachedMasterBundle);
  const [error, setError] = useState(null);

  const fetchMasters = useCallback(async (bypassCache = false) => {
    const now = Date.now();
    if (!bypassCache && cachedMasterBundle && now - cacheTimestamp < CACHE_TTL_MS) {
      setData(cachedMasterBundle);
      setIsLoading(false);
      return;
    }

    try {
      const result = await masterApi.getAll();
      cachedMasterBundle = result;
      cacheTimestamp = Date.now();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch master data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const now = Date.now();
      if (!forceRefresh && cachedMasterBundle && now - cacheTimestamp < CACHE_TTL_MS) {
        if (isMounted) {
          setData(cachedMasterBundle);
          setIsLoading(false);
        }
        return;
      }

      try {
        const result = await masterApi.getAll();
        if (isMounted) {
          cachedMasterBundle = result;
          cacheTimestamp = Date.now();
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch master data.');
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [forceRefresh]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    return fetchMasters(true);
  }, [fetchMasters]);

  return {
    ...data,
    isLoading,
    error,
    refetch,
  };
}
