import { useState, useEffect, useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { MULTICALL_ADDRESS, MULTICALL_ABI } from '@/lib/constants';

interface UseSellQuoteParams {
  tokenAddress?: string;
  tokenAmount: string;
  enabled?: boolean;
  delay?: number;
}

interface UseSellQuoteReturn {
  usdcAmtOut: string | undefined;
  rawUsdcAmtOut: bigint | undefined;
  minUsdcAmtOut: bigint | undefined;
  autoMinUsdcAmtOut: bigint | undefined;
  slippage: bigint | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to get a sell quote with debouncing
 * Similar to useBuyQuote but for selling tokens
 */
export function useDebouncedSellQuote({
  tokenAddress,
  tokenAmount,
  enabled = true,
  delay = 500
}: UseSellQuoteParams): UseSellQuoteReturn {
  const [debouncedAmount, setDebouncedAmount] = useState(tokenAmount);

  // Debounce the token amount
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(tokenAmount);
    }, delay);

    return () => clearTimeout(timer);
  }, [tokenAmount, delay]);

  // Parse the token amount (18 decimals for tokens)
  const parsedAmount = useMemo(() => {
    try {
      const amount = parseFloat(debouncedAmount);
      if (isNaN(amount) || amount <= 0) return undefined;
      return parseUnits(debouncedAmount, 18); // 18 decimals for tokens
    } catch (error) {
      console.error('Error parsing token amount:', error);
      return undefined;
    }
  }, [debouncedAmount]);

  // Get sell quote from multicall contract
  const { data, isLoading, error } = useReadContract({
    address: MULTICALL_ADDRESS,
    abi: MULTICALL_ABI,
    functionName: 'sellTokenIn',
    args: tokenAddress && parsedAmount ? [
      tokenAddress as `0x${string}`,
      parsedAmount,
      BigInt(9500) // 95% slippage tolerance (for getting minimum amount)
    ] : undefined,
    query: {
      enabled: !!tokenAddress && !!parsedAmount && enabled,
      refetchInterval: 10000, // Refetch every 10 seconds
      staleTime: 5000, // Consider data stale after 5 seconds
    }
  });

  // Parse the response
  const result = useMemo(() => {
    if (!data) {
      return {
        usdcAmtOut: undefined,
        rawUsdcAmtOut: undefined,
        minUsdcAmtOut: undefined,
        autoMinUsdcAmtOut: undefined,
        slippage: undefined,
      };
    }

    const [quoteRawOut, slippage, minQuoteRawOut, autoMinQuoteRawOut] = data as [bigint, bigint, bigint, bigint];

    // Format USDC amount for display (6 decimals)
    const formattedUsdcOut = formatUnits(quoteRawOut, 6);

    return {
      usdcAmtOut: formattedUsdcOut,
      rawUsdcAmtOut: quoteRawOut,
      minUsdcAmtOut: minQuoteRawOut,
      autoMinUsdcAmtOut: autoMinQuoteRawOut,
      slippage,
    };
  }, [data]);

  return {
    ...result,
    isLoading,
    error: error as Error | null,
  };
}