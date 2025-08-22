/**
 * Custom hook for managing curate data fetching and state
 * 
 * @description Handles loading, pagination, error states, and real-time updates
 * for curate content with optimized API calls and caching.
 */

"use client";

import { useState, useCallback, useRef } from 'react';
import { 
  fetchCurates,
  DEFAULT_FIRST,
  LOAD_MORE_LIMIT,
  type Curate
} from '@/lib/constants';

interface UseCurateDataReturn {
  /** Array of curate items */
  curates: Curate[];
  /** Loading state for initial load */
  loading: boolean;
  /** Loading state for loading more items */
  loadingMore: boolean;
  /** Loading state for refresh */
  refreshing: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether more items are available */
  hasMore: boolean;
  /** Whether using mock data */
  useMockData: boolean;
  /** Set of newly added item IDs for animation */
  newItems: Set<string>;
  /** Load initial curates */
  loadCurates: (isInitialLoad?: boolean, isRefresh?: boolean) => Promise<void>;
  /** Load more curates for pagination */
  loadMoreCurates: () => Promise<void>;
  /** Check for new curates */
  checkForNewCurates: () => Promise<void>;
  /** Add curates to the beginning of the list */
  addNewCurates: (newCurates: Curate[]) => void;
  /** Reset all state */
  reset: () => void;
}

/**
 * Hook for managing curate data
 * 
 * @returns Object with curate data and management functions
 */
export function useCurateData(): UseCurateDataReturn {
  const [curates, setCurates] = useState<Curate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [newItems, setNewItems] = useState<Set<string>>(new Set());
  const lastTimestampRef = useRef<string>('');

  const loadCurates = useCallback(async (isInitialLoad = false, isRefresh = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      if (isRefresh) setRefreshing(true);
      
      // Try to fetch real data first
      try {
        const data = await fetchCurates(DEFAULT_FIRST, 0);
        setCurates(data);
        setError(null);
        setUseMockData(false);
        setHasMore(data.length >= DEFAULT_FIRST);
        setCurrentPage(1);
        
        // Update last timestamp for polling
        if (data.length > 0) {
          lastTimestampRef.current = data[0].timestamp;
        }
      } catch (fetchError) {
        console.error('Failed to fetch data:', fetchError);
        
        // Check if it's a rate limit error
        const isRateLimit = fetchError instanceof Error && fetchError.message.includes('Rate limit exceeded');
        const isIndexing = fetchError instanceof Error && fetchError.message.includes('currently being indexed');
        
        if (isRateLimit) {
          setError('API rate limit exceeded. Please wait a few minutes and refresh.');
        } else if (isIndexing) {
          setError('The subgraph is currently being indexed. Please wait a few minutes and refresh.');
        } else {
          setError('Unable to fetch content from the API');
        }
        
        setCurates([]);
        setUseMockData(false);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading curates:', err);
      if (isInitialLoad) {
        setError('Failed to load content');
      }
    } finally {
      if (isInitialLoad) setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  const loadMoreCurates = useCallback(async () => {
    if (loadingMore || !hasMore || useMockData) return;
    
    try {
      setLoadingMore(true);
      const data = await fetchCurates(LOAD_MORE_LIMIT, currentPage * LOAD_MORE_LIMIT);
      
      if (data.length > 0) {
        setCurates(prevCurates => {
          const existingIds = new Set(prevCurates.map(c => c.id));
          const newCurations = data.filter(c => !existingIds.has(c.id));
          return [...prevCurates, ...newCurations];
        });
        setCurrentPage(prev => prev + 1);
        setHasMore(data.length >= LOAD_MORE_LIMIT);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more curates:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, loadingMore, hasMore, useMockData]);

  const checkForNewCurates = useCallback(async () => {
    if (useMockData || !lastTimestampRef.current) return;
    
    try {
      // Fetch only the most recent items
      const data = await fetchCurates(10, 0);
      
      if (data.length === 0) return;
      
      // Find new items by comparing timestamps
      const newestTimestamp = data[0].timestamp;
      const newCurates = data.filter(curate => 
        curate.timestamp > lastTimestampRef.current
      );
      
      if (newCurates.length > 0) {
        addNewCurates(newCurates);
        
        // Update last timestamp
        lastTimestampRef.current = newestTimestamp;
      }
    } catch (error) {
      console.error('Error checking for new curates:', error);
    }
  }, [useMockData]);

  const addNewCurates = useCallback((newCurates: Curate[]) => {
    setCurates(prevCurates => {
      const existingIds = new Set(prevCurates.map(c => c.id));
      const uniqueNewCurates = newCurates.filter(c => !existingIds.has(c.id));
      
      if (uniqueNewCurates.length > 0) {
        // Mark items as new for animation
        setNewItems(prev => {
          const newSet = new Set(prev);
          uniqueNewCurates.forEach(curate => newSet.add(curate.id));
          return newSet;
        });
        
        // Clear animation state after animation completes
        setTimeout(() => {
          setNewItems(prev => {
            const newSet = new Set(prev);
            uniqueNewCurates.forEach(curate => newSet.delete(curate.id));
            return newSet;
          });
        }, 1000);
        
        return [...uniqueNewCurates, ...prevCurates];
      }
      
      return prevCurates;
    });
  }, []);

  const reset = useCallback(() => {
    setCurates([]);
    setLoading(true);
    setLoadingMore(false);
    setRefreshing(false);
    setError(null);
    setUseMockData(false);
    setHasMore(true);
    setCurrentPage(0);
    setNewItems(new Set());
    lastTimestampRef.current = '';
  }, []);

  return {
    curates,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    useMockData,
    newItems,
    loadCurates,
    loadMoreCurates,
    checkForNewCurates,
    addNewCurates,
    reset
  };
}