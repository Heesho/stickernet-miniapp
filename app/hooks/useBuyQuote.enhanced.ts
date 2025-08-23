/**
 * Enhanced Buy Quote Hook with Centralized Loading State Management
 * 
 * Extends the existing useBuyQuote hook with the new loading state system,
 * better error handling, and improved UX patterns.
 */

import { useReadContract } from 'wagmi';
import { parseUnits, formatUnits, isAddress } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { MULTICALL_ADDRESS, MULTICALL_ABI, USDC_DECIMALS } from '@/lib/constants';
import debounce from 'lodash/debounce';
import { useCallback, useMemo, useState, useEffect } from 'react';
import type { Address } from 'viem';
import { useLoadingState } from './useLoadingState';
import { useErrorHandler } from './useErrorHandler';

interface UseBuyQuoteEnhancedParams {
  tokenAddress: string | undefined;
  usdcAmount: string;
  enabled?: boolean;
  /** Whether to show loading indicators globally */
  showGlobalLoading?: boolean;
  /** Custom debounce delay */
  debounceDelay?: number;
  /** Whether to enable optimistic updates */
  optimistic?: boolean;
}

interface BuyQuoteEnhancedResult {
  // Quote data
  tokenAmtOut: string;
  rawTokenAmtOut: bigint | undefined;
  slippage: bigint | undefined;
  minTokenAmtOut: bigint | undefined;
  autoMinTokenAmtOut: bigint | undefined;
  
  // Enhanced loading states
  isLoading: boolean;
  isValidating: boolean;
  isDebouncing: boolean;
  isEmpty: boolean;
  hasValidQuote: boolean;
  
  // Error handling
  isError: boolean;
  error: any;
  canRetry: boolean;
  retry: () => void;
  
  // Loading operations
  loadingStates: {
    fetchingQuote: boolean;
    validatingInputs: boolean;
    debouncing: boolean;
  };
  
  // Actions
  refetch: () => void;
  clearError: () => void;
  
  // Optimization
  priceImpact?: number;
  estimatedGas?: bigint;
  confidence: 'high' | 'medium' | 'low';
}

interface QuoteValidation {
  isValid: boolean;
  error?: string;
  parsedAmount?: bigint;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Enhanced input validation with confidence scoring
 */
function validateInputsEnhanced(tokenAddress: string | undefined, usdcAmount: string): QuoteValidation {
  // Validate token address
  if (!tokenAddress || !isAddress(tokenAddress)) {
    return {
      isValid: false,
      error: 'Invalid token address',
      confidence: 'low'
    };
  }

  // Validate USDC amount
  const trimmedAmount = usdcAmount.trim();
  if (!trimmedAmount || trimmedAmount === '0' || trimmedAmount === '0.00') {
    return { 
      isValid: false, 
      confidence: 'high' 
    }; // Valid empty state
  }

  // Check for valid number format
  const numericAmount = parseFloat(trimmedAmount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return {
      isValid: false,
      error: 'Please enter a valid amount',
      confidence: 'low'
    };
  }

  // Check for reasonable limits
  if (numericAmount > 1000000) {
    return {
      isValid: false,
      error: 'Amount is too large. Maximum is 1,000,000 USDC',
      confidence: 'medium'
    };
  }

  if (numericAmount < 0.01) {
    return {
      isValid: false,
      error: 'Minimum amount is $0.01 USDC',
      confidence: 'medium'
    };
  }

  try {
    const parsedAmount = parseUnits(trimmedAmount, USDC_DECIMALS);
    
    // Confidence scoring based on amount
    let confidence: 'high' | 'medium' | 'low' = 'high';
    if (numericAmount < 1) confidence = 'medium';
    if (numericAmount > 100000) confidence = 'medium';
    
    return {
      isValid: true,
      parsedAmount,
      confidence
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid amount format',
      confidence: 'low'
    };
  }
}

/**
 * Calculate price impact from quote data
 */
function calculatePriceImpact(
  inputAmount: bigint,
  outputAmount: bigint,
  marketPrice: bigint
): number {
  if (marketPrice === 0n || inputAmount === 0n) return 0;
  
  const expectedOutput = (inputAmount * marketPrice) / parseUnits('1', USDC_DECIMALS);
  const actualOutput = outputAmount;
  
  if (expectedOutput === 0n) return 0;
  
  const impact = Number(
    ((expectedOutput - actualOutput) * 10000n) / expectedOutput
  ) / 100;
  
  return Math.abs(impact);
}

/**
 * Enhanced buy quote hook with centralized loading management
 */
export function useBuyQuoteEnhanced({
  tokenAddress,
  usdcAmount,
  enabled = true,
  showGlobalLoading = false,
  debounceDelay = 300,
  optimistic = true
}: UseBuyQuoteEnhancedParams): BuyQuoteEnhancedResult {
  
  // Loading state management
  const loadingState = useLoadingState({
    hookName: 'useBuyQuoteEnhanced',
    showGlobal: showGlobalLoading,
    autoClearStates: true,
    autoClearTimeout: 2000,
    minLoadingDuration: 150
  });

  // Error handling
  const errorHandler = useErrorHandler({
    hookName: 'useBuyQuoteEnhanced',
    showToast: false,
    customErrorMapper: (error) => ({
      category: 'contract' as const,
      severity: 'medium' as const,
      userMessage: 'Failed to get quote',
      recoverySuggestion: 'Please try again with a different amount.',
      retryable: true
    })
  });

  // Debounced state
  const [debouncedAmount, setDebouncedAmount] = useState(usdcAmount);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Validation with confidence
  const validation = useMemo(() => 
    validateInputsEnhanced(tokenAddress, debouncedAmount), 
    [tokenAddress, debouncedAmount]
  );

  // Slippage tolerance
  const slippageTolerance = 9000n; // 10%

  // Contract query configuration
  const shouldFetch = enabled && validation.isValid && !!validation.parsedAmount && validation.parsedAmount > 0n;

  // Enhanced debouncing
  const debouncedSetAmount = useCallback(
    debounce((amount: string) => {
      setDebouncedAmount(amount);
      setIsDebouncing(false);
    }, debounceDelay),
    [debounceDelay]
  );

  // Handle input changes with loading states
  useEffect(() => {
    // Immediate update for empty states
    if (!usdcAmount || usdcAmount === '0' || usdcAmount === '0.00') {
      setDebouncedAmount(usdcAmount);
      setIsDebouncing(false);
      return;
    }

    // Start debouncing operation
    if (usdcAmount !== debouncedAmount) {
      setIsDebouncing(true);
      const operationId = loadingState.startLoading({
        type: 'search',
        message: 'Updating quote...',
        priority: 'low',
        showGlobally: false
      });

      const cleanup = () => {
        loadingState.completeOperation(operationId);
      };

      // Debounce with cleanup
      debouncedSetAmount(usdcAmount);
      
      // Complete debounce operation after delay
      setTimeout(cleanup, debounceDelay);
    }

    return () => {
      debouncedSetAmount.cancel();
    };
  }, [usdcAmount, debouncedAmount, debouncedSetAmount, debounceDelay, loadingState]);

  // Contract read hook
  const { data, isLoading, isError, error, isFetching, refetch } = useReadContract({
    address: MULTICALL_ADDRESS,
    abi: MULTICALL_ABI,
    functionName: 'buyQuoteIn',
    args: shouldFetch ? [tokenAddress as Address, validation.parsedAmount!, slippageTolerance] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: shouldFetch,
      staleTime: 1000 * 10, // 10 seconds
      gcTime: 1000 * 60 * 5, // 5 minutes
      refetchInterval: false,
      retry: (failureCount, error) => {
        if (!validation.isValid) return false;
        
        const errorMsg = error?.message || '';
        if (errorMsg.includes('network') || errorMsg.includes('RPC')) {
          return failureCount < 2;
        }
        if (errorMsg.includes('revert')) return false;
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    }
  });

  // Track loading operations
  useEffect(() => {
    if (isLoading && shouldFetch) {
      const operationId = loadingState.startLoading({
        type: 'fetch_data',
        message: 'Fetching quote...',
        priority: 'medium',
        showGlobally: showGlobalLoading
      });

      return () => {
        loadingState.completeOperation(operationId);
      };
    }
  }, [isLoading, shouldFetch, loadingState, showGlobalLoading]);

  // Handle errors
  useEffect(() => {
    if (isError && error) {
      errorHandler.handleError(error, {
        tokenAddress,
        usdcAmount: debouncedAmount,
        validation: validation.isValid
      });
    } else if (!isError) {
      errorHandler.clearError();
    }
  }, [isError, error, errorHandler, tokenAddress, debouncedAmount, validation.isValid]);

  // Process quote data with enhanced calculations
  const processedData = useMemo(() => {
    if (!data || !(data as [bigint, bigint, bigint, bigint])[0] || !validation.parsedAmount) {
      return {
        tokenAmtOut: '0',
        rawTokenAmtOut: undefined,
        slippage: undefined,
        minTokenAmtOut: undefined,
        autoMinTokenAmtOut: undefined,
        priceImpact: 0,
        confidence: validation.confidence
      };
    }

    const typedData = data as [bigint, bigint, bigint, bigint];
    const tokenOut = typedData[0];
    const slippageRaw = typedData[1];
    const minTokenOut = typedData[2];
    const autoMinTokenOut = typedData[3];

    // Calculate price impact
    const marketPrice = parseUnits('1', 18); // Simplified - would need actual market price
    const priceImpact = calculatePriceImpact(validation.parsedAmount, tokenOut, marketPrice);

    // Format output
    const tokenAmtOut = formatUnits(tokenOut, 18);

    return {
      tokenAmtOut,
      rawTokenAmtOut: tokenOut,
      slippage: slippageRaw,
      minTokenAmtOut: minTokenOut,
      autoMinTokenAmtOut: autoMinTokenOut,
      priceImpact,
      confidence: validation.confidence
    };
  }, [data, validation.parsedAmount, validation.confidence]);

  // Enhanced retry function
  const retry = useCallback(() => {
    errorHandler.clearError();
    refetch();
  }, [errorHandler, refetch]);

  // Loading states breakdown
  const loadingStates = {
    fetchingQuote: isLoading,
    validatingInputs: false, // Synchronous operation
    debouncing: isDebouncing
  };

  // Determine overall loading state
  const isOverallLoading = isLoading || isDebouncing;
  const isValidating = isFetching && !isLoading;
  const isEmpty = !validation.isValid && !validation.error;
  const hasValidQuote = !!(data && (data as [bigint, bigint, bigint, bigint])[0] && (data as [bigint, bigint, bigint, bigint])[0] > 0n);

  return {
    // Quote data
    ...processedData,
    
    // Loading states
    isLoading: isOverallLoading,
    isValidating,
    isDebouncing,
    isEmpty,
    hasValidQuote,
    
    // Error handling
    isError: isError || !!validation.error,
    error: validation.error || errorHandler.error,
    canRetry: errorHandler.canRetry,
    retry,
    
    // Loading operations
    loadingStates,
    
    // Actions
    refetch,
    clearError: errorHandler.clearError,
    
    // Additional data
    estimatedGas: undefined, // Could be enhanced with gas estimation
    confidence: processedData.confidence
  };
}

/**
 * Simplified version for basic use cases
 */
export function useSimpleBuyQuote(tokenAddress: string | undefined, usdcAmount: string) {
  return useBuyQuoteEnhanced({
    tokenAddress,
    usdcAmount,
    enabled: true,
    showGlobalLoading: false,
    debounceDelay: 300,
    optimistic: true
  });
}