import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMulticall } from './useMulticall';
import { useTokenPosition } from './useTokenPosition';
import { useChartData } from './useChartData';

interface UseRealTimeDataProps {
  tokenAddress: string;
  userAddress?: string;
  enabled?: boolean;
  aggressivePolling?: boolean; // For active trading scenarios
}

export function useRealTimeData({
  tokenAddress,
  userAddress,
  enabled = true,
  aggressivePolling = false
}: UseRealTimeDataProps) {
  const queryClient = useQueryClient();
  const lastPriceRef = useRef<string>();
  
  // Determine polling intervals based on user activity
  const pricePollingInterval = aggressivePolling ? 5000 : 15000; // 5s aggressive, 15s normal
  const positionPollingInterval = aggressivePolling ? 10000 : 30000; // 10s aggressive, 30s normal
  
  // Use visibility-aware polling
  const [shouldPoll, setShouldPoll] = useState(true);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setShouldPoll(!document.hidden && enabled);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled]);

  // Enhanced multicall with polling
  const multicallData = useMulticall({
    tokenAddress,
    userAddress,
    refetchInterval: shouldPoll ? pricePollingInterval : false,
    refetchIntervalInBackground: false,
    staleTime: pricePollingInterval / 2, // Half the polling interval
    cacheTime: pricePollingInterval * 2, // Double the polling interval
  });

  // Enhanced token position with polling
  const positionData = useTokenPosition({
    userAddress: userAddress || '',
    tokenAddress,
    enabled: !!userAddress && enabled,
    refetchInterval: shouldPoll ? positionPollingInterval : false,
    refetchIntervalInBackground: false,
  });

  // Chart data already has polling for LIVE timeframe
  const chartData = useChartData(
    tokenAddress,
    'LIVE',
    enabled
  );

  // Detect price changes for animations
  useEffect(() => {
    if (multicallData.tokenData?.marketPrice && lastPriceRef.current !== multicallData.tokenData.marketPrice) {
      const previousPrice = lastPriceRef.current;
      lastPriceRef.current = multicallData.tokenData.marketPrice;
      
      // Trigger price change event for animations
      if (previousPrice) {
        window.dispatchEvent(new CustomEvent('priceChanged', {
          detail: {
            tokenAddress,
            previousPrice,
            newPrice: multicallData.tokenData.marketPrice,
            direction: BigInt(multicallData.tokenData.marketPrice) > BigInt(previousPrice) ? 'up' : 'down'
          }
        }));
      }
    }
  }, [multicallData.tokenData?.marketPrice, tokenAddress]);

  // Force refresh function for after user actions
  const forceRefresh = async () => {
    console.log('Force refreshing all data for token:', tokenAddress);
    
    // Invalidate all React Query caches
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['useReadContract'] }),
      queryClient.invalidateQueries({ queryKey: ['multicall'] }),
      queryClient.invalidateQueries({ queryKey: ['tokenPosition'] }),
      queryClient.invalidateQueries({ queryKey: ['chartData'] }),
    ]);
    
    // Also refetch multicall data if available
    if (multicallData.refetch) {
      await multicallData.refetch();
    }
  };

  // Auto-refresh after user transactions
  const refreshAfterTransaction = async (txHash?: string) => {
    console.log('Transaction completed, starting refresh sequence...', txHash);
    
    // Immediate optimistic update
    await forceRefresh();
    
    // Delayed refresh to catch blockchain confirmation
    setTimeout(async () => {
      console.log('Refreshing after blockchain confirmation...');
      await forceRefresh();
    }, 3000);
    
    // Final refresh to ensure consistency
    setTimeout(async () => {
      console.log('Final refresh for consistency...');
      await forceRefresh();
    }, 10000);
  };

  return {
    ...multicallData,
    positionData,
    chartData,
    isPolling: shouldPoll,
    forceRefresh,
    refreshAfterTransaction,
    setAggressivePolling: (aggressive: boolean) => {
      // This would need to be implemented with a state management solution
      // For now, pass aggressivePolling as a prop
    }
  };
}