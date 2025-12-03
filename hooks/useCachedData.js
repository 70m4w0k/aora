import { useState, useEffect, useCallback, useRef } from 'react';
import cache from '../lib/cache';
import { handleError, parseAppwriteError } from '../lib/errorHandler';

/**
 * Custom hook for fetching data with caching and error handling
 * 
 * @param {Function} fetchFn - Async function to fetch data
 * @param {Array} dependencies - Dependencies array (like useEffect)
 * @param {Object} options - Configuration options
 * @param {string} options.cacheKey - Cache key prefix
 * @param {number} options.cacheTTL - Cache TTL in milliseconds
 * @param {boolean} options.enableCache - Enable caching (default: true)
 * @param {boolean} options.showErrorAlert - Show error alert (default: false)
 * @param {boolean} options.refetchOnMount - Refetch on mount even if cached (default: false)
 */
export function useCachedData(fetchFn, dependencies = [], options = {}) {
  const {
    cacheKey = 'data',
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    enableCache = true,
    showErrorAlert = false,
    refetchOnMount = false,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Generate cache key with dependencies
  const getCacheKey = useCallback(() => {
    return cacheKey + (dependencies.length > 0 ? `:${JSON.stringify(dependencies)}` : '');
  }, [cacheKey, dependencies]);

  const fetchData = useCallback(async (isRefresh = false) => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Check cache first (unless refreshing)
      if (!isRefresh && enableCache && !refetchOnMount) {
        const cachedData = cache.get(getCacheKey());
        if (cachedData !== null) {
          if (isMountedRef.current) {
            setData(cachedData);
            setLoading(false);
            setError(null);
          }
          return cachedData;
        }
      }

      // Set loading state
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch data
      const result = await fetchFn(signal);
      
      // Check if request was aborted
      if (signal.aborted) {
        return;
      }

      // Cache the result
      if (enableCache && result !== null && result !== undefined) {
        cache.set(getCacheKey(), result, cacheTTL);
      }

      // Update state
      if (isMountedRef.current) {
        setData(result);
        setError(null);
      }

      return result;
    } catch (err) {
      // Don't update state if request was aborted
      if (signal.aborted) {
        return;
      }

      const errorMessage = parseAppwriteError(err);
      const errorObj = {
        message: errorMessage,
        originalError: err,
      };

      if (isMountedRef.current) {
        setError(errorObj);
        setData(null);
        
        if (showErrorAlert) {
          handleError(err, 'useCachedData', true);
        }
      }

      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      abortControllerRef.current = null;
    }
  }, [fetchFn, getCacheKey, enableCache, refetchOnMount, cacheTTL, showErrorAlert]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Manual refresh function
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Clear cache for this key
  const clearCache = useCallback(() => {
    cache.delete(getCacheKey());
  }, [getCacheKey]);

  return {
    data,
    loading,
    error,
    refreshing,
    refetch,
    clearCache,
  };
}

export default useCachedData;

