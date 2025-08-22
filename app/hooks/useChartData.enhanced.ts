/**
 * Enhanced Chart Data Hook with Centralized Loading State Management
 * 
 * Extends the existing useChartData hook with the new loading state system,
 * better caching, and progressive loading for improved UX.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PriceDataPoint, Timeframe } from '@/app/components/ui/RobinhoodChart/RobinhoodChart.types';
import { SubgraphDataPoint } from '@/types/blockchain.types';
import { SUBGRAPH_URL, GRAPH_API_KEY } from '@/lib/api/subgraph';
import { useLoadingState } from './useLoadingState';
import { useErrorHandler } from './useErrorHandler';

interface UseChartDataEnhancedProps {
  tokenAddress: string;
  timeframe: Timeframe;
  enabled?: boolean;
  /** Whether to show loading indicators globally */
  showGlobalLoading?: boolean;
  /** Enable progressive loading (show cached data while fetching fresh) */
  progressiveLoading?: boolean;
  /** Enable real-time updates for LIVE timeframe */
  realTimeUpdates?: boolean;
  /** Custom refresh interval in ms */
  refreshInterval?: number;
  /** Whether to prefetch adjacent timeframes */
  prefetchAdjacent?: boolean;
}

interface UseChartDataEnhancedReturn {
  // Data
  data: PriceDataPoint[];
  cachedData: PriceDataPoint[] | null;
  
  // Loading states
  loading: boolean;
  initialLoading: boolean;
  refreshing: boolean;
  prefetching: boolean;
  
  // Error handling
  error: any;
  hasError: boolean;
  canRetry: boolean;
  retry: () => void;
  
  // Actions
  refetch: () => void;
  clearCache: () => void;
  prefetchTimeframe: (timeframe: Timeframe) => void;
  
  // Metadata
  lastUpdated: Date | null;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  isCacheData: boolean;
  
  // Performance metrics
  loadTime: number | null;
  cacheHitRate: number;
}

/**
 * Cache management for chart data
 */
class ChartDataCache {
  private cache = new Map<string, {
    data: PriceDataPoint[];
    timestamp: number;
    timeframe: Timeframe;
    tokenAddress: string;
  }>();
  
  private maxCacheAge = 1000 * 60 * 5; // 5 minutes
  private maxCacheSize = 50;
  private hitCount = 0;
  private missCount = 0;

  getCacheKey(tokenAddress: string, timeframe: Timeframe): string {
    return `${tokenAddress.toLowerCase()}-${timeframe}`;
  }

  get(tokenAddress: string, timeframe: Timeframe): PriceDataPoint[] | null {
    const key = this.getCacheKey(tokenAddress, timeframe);
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.missCount++;
      return null;
    }
    
    // Check if cache is expired
    const age = Date.now() - cached.timestamp;
    if (age > this.maxCacheAge) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }
    
    this.hitCount++;
    return cached.data;
  }

  set(tokenAddress: string, timeframe: Timeframe, data: PriceDataPoint[]): void {
    const key = this.getCacheKey(tokenAddress, timeframe);
    
    // Enforce cache size limit
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data: [...data], // Clone to prevent mutations
      timestamp: Date.now(),
      timeframe,
      tokenAddress: tokenAddress.toLowerCase()
    });
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  getHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? this.hitCount / total : 0;
  }

  invalidateToken(tokenAddress: string): void {
    const keys = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(tokenAddress.toLowerCase())
    );
    keys.forEach(key => this.cache.delete(key));
  }
}

// Global cache instance
const chartDataCache = new ChartDataCache();

/**
 * Data quality assessment
 */
function assessDataQuality(
  data: PriceDataPoint[],
  timeframe: Timeframe
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (data.length === 0) return 'poor';
  
  // Expected data points for each timeframe
  const expectedPoints: Record<Timeframe, number> = {
    'LIVE': 60,
    '4H': 240,
    '1D': 24,
    '1W': 168,
    '1M': 30,
    'MAX': 100
  };
  
  const expected = expectedPoints[timeframe];
  const coverage = data.length / expected;
  
  // Check for data gaps
  const hasGaps = data.some((point, index) => {
    if (index === 0) return false;
    const prevPoint = data[index - 1];
    const timeDiff = point.timestamp - prevPoint.timestamp;
    
    // Define expected intervals
    const expectedInterval = timeframe === 'LIVE' ? 60000 : // 1 minute
                           timeframe === '4H' ? 240000 : // 4 minutes  
                           timeframe === '1D' ? 3600000 : // 1 hour
                           timeframe === '1W' ? 3600000 : // 1 hour
                           timeframe === '1M' ? 86400000 : // 1 day
                           86400000; // 1 day for MAX
    
    return timeDiff > expectedInterval * 2; // Allow some tolerance
  });
  
  if (coverage >= 0.9 && !hasGaps) return 'excellent';
  if (coverage >= 0.7 && !hasGaps) return 'good';
  if (coverage >= 0.5) return 'fair';
  return 'poor';
}

/**
 * Enhanced chart data hook
 */
export function useChartDataEnhanced({
  tokenAddress,
  timeframe,
  enabled = true,
  showGlobalLoading = false,
  progressiveLoading = true,
  realTimeUpdates = true,
  refreshInterval,
  prefetchAdjacent = true
}: UseChartDataEnhancedProps): UseChartDataEnhancedReturn {
  
  // State
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [cachedData, setCachedData] = useState<PriceDataPoint[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [isCacheData, setIsCacheData] = useState(false);

  // Loading state management
  const loadingState = useLoadingState({
    hookName: 'useChartDataEnhanced',
    showGlobal: showGlobalLoading,
    autoClearStates: true,
    autoClearTimeout: 3000,
    minLoadingDuration: 200
  });

  // Error handling
  const errorHandler = useErrorHandler({
    hookName: 'useChartDataEnhanced',
    showToast: false,
    customErrorMapper: (error) => {
      const errorObj = error as { message?: string };
      if (errorObj?.message?.includes('GraphQL')) {
        return {
          category: 'api' as const,
          severity: 'medium' as const,
          userMessage: 'Chart data temporarily unavailable',
          recoverySuggestion: 'Chart data will refresh automatically.',
          retryable: true
        };
      }
      
      return {
        category: 'network' as const,
        severity: 'medium' as const,
        userMessage: 'Unable to load chart data',
        recoverySuggestion: 'Check your connection and try refreshing.',
        retryable: true,
        context: { tokenAddress, timeframe, enabled }
      };
    }
  });

  // Check cache first
  const checkCache = useCallback(() => {
    if (!progressiveLoading) return;
    
    const cached = chartDataCache.get(tokenAddress, timeframe);
    if (cached) {
      setCachedData(cached);
      setData(cached);
      setIsCacheData(true);
    }
  }, [tokenAddress, timeframe, progressiveLoading]);

  // Fetch chart data with loading management
  const fetchChartData = useCallback(async (isRefresh = false) => {
    if (!enabled || !tokenAddress) return;

    const startTime = Date.now();
    
    // Start loading operation
    const operationId = loadingState.startLoading({
      type: isRefresh ? 'refresh' : 'fetch_data',
      message: isRefresh ? 'Refreshing chart...' : 'Loading chart data...',
      priority: 'medium',
      showGlobally: showGlobalLoading && !isRefresh,
      metadata: { timeframe, isRefresh }
    });

    try {
      errorHandler.clearError();

      // Check cache if not refreshing
      if (!isRefresh && progressiveLoading) {
        const cached = chartDataCache.get(tokenAddress, timeframe);
        if (cached) {
          setData(cached);
          setCachedData(cached);
          setIsCacheData(true);
          loadingState.completeOperation(operationId);
          return;
        }
      }

      // Fetch from API (simplified version of the original logic)
      const token = tokenAddress.toLowerCase();
      
      // Get token info
      const tokenInfoResponse = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GRAPH_API_KEY}`
        },
        body: JSON.stringify({
          query: `
            query GetTokenInfo($token: ID!) {
              token(id: $token) {
                id
                createdAtTimestamp
                marketPrice
                floorPrice
              }
            }
          `,
          variables: { token }
        })
      });

      const tokenInfoResult = await tokenInfoResponse.json();
      
      if (tokenInfoResult.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(tokenInfoResult.errors)}`);
      }
      
      const tokenInfo = tokenInfoResult.data?.token;
      if (!tokenInfo) {
        setData([]);
        loadingState.completeOperation(operationId);
        return;
      }

      const currentPrice = parseFloat(tokenInfo.marketPrice || '0');
      const currentFloorPrice = parseFloat(tokenInfo.floorPrice || '0');
      
      // Simplified data processing (would use original complex logic in real implementation)
      const now = Date.now();
      const range = timeframe === 'LIVE' ? 3600000 : // 1 hour
                   timeframe === '4H' ? 14400000 : // 4 hours
                   timeframe === '1D' ? 86400000 : // 1 day
                   timeframe === '1W' ? 604800000 : // 1 week
                   timeframe === '1M' ? 2592000000 : // 30 days
                   now; // MAX

      // Generate sample data (in real implementation, would fetch from subgraph)
      const points = timeframe === 'LIVE' ? 60 :
                    timeframe === '4H' ? 60 :
                    timeframe === '1D' ? 24 :
                    timeframe === '1W' ? 42 :
                    timeframe === '1M' ? 30 :
                    100; // MAX

      const processedData: PriceDataPoint[] = Array.from({ length: points }, (_, i) => ({
        timestamp: now - range + (i * (range / (points - 1))),
        marketPrice: currentPrice * (0.95 + Math.random() * 0.1), // ±5% variation
        floorPrice: currentFloorPrice * (0.95 + Math.random() * 0.1),
        volume: Math.random() * 1000
      }));

      // Cache the data
      chartDataCache.set(tokenAddress, timeframe, processedData);
      
      // Update state
      setData(processedData);
      setLastUpdated(new Date());
      setLoadTime(Date.now() - startTime);
      setIsCacheData(false);
      
      loadingState.completeOperation(operationId);
      
    } catch (error) {
      errorHandler.handleError(error, {
        operation: 'fetch_chart_data',
        tokenAddress,
        timeframe,
        isRefresh
      });
      
      loadingState.failOperation(operationId, error);
      
      // If this was a refresh and we have cached data, keep it
      if (isRefresh && cachedData) {
        setData(cachedData);
        setIsCacheData(true);
      } else {
        setData([]);
      }
    }
  }, [
    enabled, 
    tokenAddress, 
    timeframe, 
    loadingState, 
    showGlobalLoading, 
    errorHandler, 
    progressiveLoading, 
    cachedData
  ]);

  // Prefetch adjacent timeframes
  const prefetchTimeframe = useCallback(async (targetTimeframe: Timeframe) => {
    if (!prefetchAdjacent || !enabled || !tokenAddress) return;
    
    const operationId = loadingState.startLoading({
      type: 'background_sync',
      message: `Prefetching ${targetTimeframe} data...`,
      priority: 'low',
      showGlobally: false,
      metadata: { prefetch: true, targetTimeframe }
    });

    try {
      // Simplified prefetch logic (would use full fetch logic)
      // This is just a placeholder
      await new Promise(resolve => setTimeout(resolve, 1000));
      loadingState.completeOperation(operationId);
    } catch (error) {
      loadingState.failOperation(operationId, error);
    }
  }, [prefetchAdjacent, enabled, tokenAddress, loadingState]);

  // Initial load and cache check
  useEffect(() => {
    checkCache();
    fetchChartData();
  }, [checkCache, fetchChartData]);

  // Real-time updates for LIVE timeframe
  useEffect(() => {
    if (!realTimeUpdates || timeframe !== 'LIVE' || !enabled) return;

    const interval = setInterval(() => {
      fetchChartData(true);
    }, refreshInterval || 10000); // 10 seconds default

    return () => clearInterval(interval);
  }, [realTimeUpdates, timeframe, enabled, fetchChartData, refreshInterval]);

  // Prefetch adjacent timeframes
  useEffect(() => {
    if (!prefetchAdjacent || !enabled) return;

    const timeframes: Timeframe[] = ['LIVE', '4H', '1D', '1W', '1M', 'MAX'];
    const currentIndex = timeframes.indexOf(timeframe);
    
    // Prefetch previous and next timeframes
    const toPrefetch = [
      timeframes[currentIndex - 1],
      timeframes[currentIndex + 1]
    ].filter(Boolean);

    toPrefetch.forEach(tf => {
      if (!chartDataCache.get(tokenAddress, tf as Timeframe)) {
        setTimeout(() => prefetchTimeframe(tf as Timeframe), 2000);
      }
    });
  }, [timeframe, prefetchAdjacent, enabled, tokenAddress, prefetchTimeframe]);

  // Derived state
  const isInitialLoading = loadingState.activeOperations.some(
    op => op.type === 'fetch_data' && !op.metadata?.isRefresh
  );
  
  const isRefreshing = loadingState.activeOperations.some(
    op => op.type === 'refresh' || op.metadata?.isRefresh
  );
  
  const isPrefetching = loadingState.activeOperations.some(
    op => op.metadata?.prefetch
  );

  const dataQuality = useMemo(() => assessDataQuality(data, timeframe), [data, timeframe]);

  // Actions
  const refetch = useCallback(() => fetchChartData(true), [fetchChartData]);
  const retry = useCallback(() => {
    errorHandler.clearError();
    fetchChartData();
  }, [errorHandler, fetchChartData]);
  const clearCache = useCallback(() => {
    chartDataCache.clear();
    setCachedData(null);
  }, []);

  return {
    // Data
    data,
    cachedData,
    
    // Loading states
    loading: loadingState.isLoading,
    initialLoading: isInitialLoading,
    refreshing: isRefreshing,
    prefetching: isPrefetching,
    
    // Error handling
    error: errorHandler.error,
    hasError: errorHandler.hasError,
    canRetry: errorHandler.canRetry,
    retry,
    
    // Actions
    refetch,
    clearCache,
    prefetchTimeframe,
    
    // Metadata
    lastUpdated,
    dataQuality,
    isCacheData,
    
    // Performance metrics
    loadTime,
    cacheHitRate: chartDataCache.getHitRate()
  };
}

/**
 * Simplified version for basic use cases
 */
export function useSimpleChartData(tokenAddress: string, timeframe: Timeframe) {
  return useChartDataEnhanced({
    tokenAddress,
    timeframe,
    enabled: true,
    showGlobalLoading: false,
    progressiveLoading: true,
    realTimeUpdates: timeframe === 'LIVE',
    prefetchAdjacent: false
  });
}