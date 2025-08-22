import { useState, useEffect, useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { parseUnits, formatUnits, isAddress } from 'viem';
import { MULTICALL_ADDRESS, MULTICALL_ABI } from '@/lib/constants';
import { useErrorHandler, type StandardError } from './useErrorHandler';

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
  isError: boolean;
  error: StandardError | null;
  isEmpty: boolean;
  hasValidQuote: boolean;
  isValidating: boolean;
}

/**
 * Validation function for sell quote inputs
 */
function validateSellInputs(tokenAddress: string | undefined, tokenAmount: string): {
  isValid: boolean;
  error?: StandardError;
  parsedAmount?: bigint;
} {
  // Validate token address
  if (!tokenAddress || !isAddress(tokenAddress)) {
    return {
      isValid: false,
      error: {
        id: 'invalid_token_address',
        category: 'validation',
        severity: 'medium',
        message: 'Invalid token address provided',
        userMessage: 'Invalid token selected. Please try again.',
        retryable: false,
        recoveryAction: 'none',
        recoverySuggestion: 'Please select a valid token.',
        timestamp: Date.now()
      }
    };
  }

  // Validate token amount
  const trimmedAmount = tokenAmount.trim();
  if (!trimmedAmount || trimmedAmount === '0' || trimmedAmount === '0.00') {
    return { isValid: false }; // Valid but empty state
  }

  // Check for valid number format
  const numericAmount = parseFloat(trimmedAmount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return {
      isValid: false,
      error: {
        id: 'invalid_amount',
        category: 'validation',
        severity: 'medium',
        message: `Invalid token amount: ${tokenAmount}`,
        userMessage: 'Please enter a valid amount.',
        retryable: false,
        recoveryAction: 'none',
        recoverySuggestion: 'Please check your input and try again.',
        timestamp: Date.now()
      }
    };
  }

  // Check for reasonable limits (max 1B tokens)
  if (numericAmount > 1000000000) {
    return {
      isValid: false,
      error: {
        id: 'amount_too_large',
        category: 'validation',
        severity: 'medium',
        message: 'Amount exceeds maximum limit',
        userMessage: 'Amount is too large. Maximum is 1 billion tokens.',
        retryable: false,
        recoveryAction: 'none',
        recoverySuggestion: 'Please enter a smaller amount.',
        timestamp: Date.now()
      }
    };
  }

  // Check for too small amounts
  if (numericAmount < 0.000001) {
    return {
      isValid: false,
      error: {
        id: 'amount_too_small',
        category: 'validation',
        severity: 'medium',
        message: 'Amount is below minimum threshold',
        userMessage: 'Minimum amount is 0.000001 tokens.',
        retryable: false,
        recoveryAction: 'none',
        recoverySuggestion: 'Please enter a larger amount.',
        timestamp: Date.now()
      }
    };
  }

  try {
    const parsedAmount = parseUnits(trimmedAmount, 18);
    return {
      isValid: true,
      parsedAmount
    };
  } catch (error) {
    return {
      isValid: false,
      error: {
        id: 'parse_error',
        category: 'validation',
        severity: 'medium',
        message: 'Failed to parse token amount',
        userMessage: 'Invalid amount format. Please check your input.',
        retryable: false,
        recoveryAction: 'none',
        recoverySuggestion: 'Please enter a valid number.',
        timestamp: Date.now()
      }
    };
  }
}

/**
 * Hook to get a sell quote with debouncing
 * Enhanced with standardized error handling and validation
 */
export function useDebouncedSellQuote({
  tokenAddress,
  tokenAmount,
  enabled = true,
  delay = 500
}: UseSellQuoteParams): UseSellQuoteReturn {
  const [debouncedAmount, setDebouncedAmount] = useState(tokenAmount);
  const [isDebouncing, setIsDebouncing] = useState(false);
  
  const errorHandler = useErrorHandler({
    hookName: 'useDebouncedSellQuote',
    showToast: true,
    enableLogging: true,
    customErrorMapper: (error: unknown) => ({
      context: {
        tokenAddress,
        tokenAmount: debouncedAmount,
        enabled
      }
    })
  });

  // Debounce the token amount with improved UX
  useEffect(() => {
    // Immediate update for empty states
    if (!tokenAmount || tokenAmount === '0' || tokenAmount === '0.00') {
      setDebouncedAmount(tokenAmount);
      setIsDebouncing(false);
      return;
    }

    // Debounce non-empty values
    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebouncedAmount(tokenAmount);
      setIsDebouncing(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [tokenAmount, delay]);

  // Validate inputs with comprehensive error handling
  const validation = useMemo(() => 
    validateSellInputs(tokenAddress, debouncedAmount), 
    [tokenAddress, debouncedAmount]
  );

  const shouldFetch = enabled && validation.isValid && !!validation.parsedAmount && validation.parsedAmount > 0n;

  // Get sell quote from multicall contract
  const { data, isLoading, error, isFetching } = useReadContract({
    address: MULTICALL_ADDRESS,
    abi: MULTICALL_ABI,
    functionName: 'sellTokenIn',
    args: shouldFetch ? [
      tokenAddress as `0x${string}`,
      validation.parsedAmount!,
      BigInt(9500) // 95% slippage tolerance (for getting minimum amount)
    ] : undefined,
    query: {
      enabled: shouldFetch,
      refetchInterval: enabled ? 10000 : false,
      staleTime: 5000,
      retry: (failureCount, error) => {
        // Don't retry client-side validation errors
        if (!validation.isValid) return false;
        // Retry network errors up to 2 times
        const errorMsg = error?.message || '';
        if (errorMsg.includes('network') || errorMsg.includes('RPC')) {
          return failureCount < 2;
        }
        // Don't retry contract reverts
        if (errorMsg.includes('revert')) return false;
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    }
  });

  // Parse the response with error handling
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

    try {
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
    } catch (parseError) {
      errorHandler.handleError(parseError, {
        context: 'result_parsing',
        rawData: data
      });
      return {
        usdcAmtOut: undefined,
        rawUsdcAmtOut: undefined,
        minUsdcAmtOut: undefined,
        autoMinUsdcAmtOut: undefined,
        slippage: undefined,
      };
    }
  }, [data, errorHandler]);

  // Enhanced error handling
  const enhancedError = useMemo(() => {
    if (validation.error) return validation.error;
    if (error) {
      return errorHandler.handleError(error, {
        context: 'contract_call',
        tokenAddress,
        amount: debouncedAmount
      });
    }
    return null;
  }, [validation.error, error, errorHandler, tokenAddress, debouncedAmount]);

  // Determine if we have a valid quote
  const hasValidQuote = !!(data && data[0] && data[0] > 0n);
  const isEmpty = !validation.isValid && !validation.error; // Valid empty state
  const isLoadingWithDebounce = isLoading || (isDebouncing && tokenAmount !== debouncedAmount);

  return {
    ...result,
    isLoading: isLoadingWithDebounce,
    isError: !!enhancedError,
    error: enhancedError,
    isEmpty,
    hasValidQuote,
    isValidating: isFetching && !isLoading,
  };
}