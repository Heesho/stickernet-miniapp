import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTokenData, useContentData } from './useMulticall';
import type { Address, TokenId } from '@/types';

interface UseMulticallAutoRefreshProps {
  tokenAddress?: Address;
  tokenId?: TokenId;
  account?: Address;
  refetchInterval?: number;
  enabled?: boolean;
}

/**
 * Hook that provides multicall data with automatic refresh
 * Manages both token data and content data with unified refresh strategy
 */
export function useMulticallAutoRefresh({
  tokenAddress,
  tokenId,
  account,
  refetchInterval = 15000, // Default 15 seconds
  enabled = true
}: UseMulticallAutoRefreshProps) {
  const queryClient = useQueryClient();
  
  // Get token data with polling
  const tokenDataResult = useTokenData({
    tokenAddress,
    account,
    enabled: !!tokenAddress && !!account && enabled,
    refetchInterval: enabled ? refetchInterval : false,
    refetchIntervalInBackground: false,
    staleTime: refetchInterval / 2,
    cacheTime: refetchInterval * 2
  });
  
  // Get content data with polling if tokenId is provided
  const contentDataResult = useContentData({
    tokenAddress,
    tokenId,
    enabled: !!tokenAddress && !!tokenId && enabled
  });
  
  // Force refresh function that invalidates all multicall queries
  const forceRefresh = async () => {
    console.log('Force refreshing multicall data...');
    
    // Invalidate all read contract queries (this will trigger refetch)
    await queryClient.invalidateQueries({ 
      queryKey: ['useReadContract'],
      exact: false,
      refetchType: 'all'
    });
    
    // Also trigger manual refetch if available
    if (tokenDataResult.refetch) {
      await tokenDataResult.refetch();
    }
  };
  
  // Refresh after transaction
  const refreshAfterTransaction = async () => {
    console.log('Transaction completed, refreshing multicall data...');
    
    // Immediate refresh
    await forceRefresh();
    
    // Delayed refresh to catch blockchain confirmation
    setTimeout(async () => {
      console.log('Secondary refresh after blockchain confirmation...');
      await forceRefresh();
    }, 3000);
  };
  
  // Set up visibility-based polling
  useEffect(() => {
    if (!enabled) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden, pausing multicall polling');
      } else {
        console.log('Page visible, resuming multicall polling');
        // Force refresh when page becomes visible
        forceRefresh();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled]);
  
  return {
    tokenData: tokenDataResult.tokenData,
    contentData: contentDataResult.contentData,
    isLoading: tokenDataResult.isLoading || contentDataResult.isLoading,
    isError: tokenDataResult.isError || contentDataResult.isError,
    error: tokenDataResult.error || contentDataResult.error,
    forceRefresh,
    refreshAfterTransaction,
    
    // Expose individual results if needed
    tokenDataResult,
    contentDataResult
  };
}