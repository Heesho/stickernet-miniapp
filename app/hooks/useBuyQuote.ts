import { useReadContract } from 'wagmi';
import { parseUnits, formatUnits, isAddress } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { MULTICALL_ADDRESS, MULTICALL_ABI, USDC_DECIMALS } from '@/lib/constants';
import debounce from 'lodash/debounce';
import { useCallback, useMemo, useState, useEffect } from 'react';
import type { Address } from 'viem';

interface UseBuyQuoteParams {
  tokenAddress: string | undefined;
  usdcAmount: string;
  enabled?: boolean;
}

interface BuyQuoteResult {
  tokenAmtOut: string;
  rawTokenAmtOut: bigint | undefined;
  slippage: bigint | undefined;
  minTokenAmtOut: bigint | undefined;
  autoMinTokenAmtOut: bigint | undefined;
  isLoading: boolean;
  isError: boolean;
  error: BuyQuoteError | null;
  isValidating: boolean;
  isEmpty: boolean;
  hasValidQuote: boolean;
}

interface BuyQuoteError {
  name: string;
  message: string;
  code?: string;
  userFriendlyMessage?: string;
  retryable?: boolean;
}

/**
 * Enhanced hook to get buy quote from multicall contract with improved error handling and caching
 * Follows OnchainKit best practices for performance and UX
 * @param tokenAddress - Address of the token to buy
 * @param usdcAmount - Amount of USDC to spend (as string)
 * @param enabled - Whether to enable the query
 * @returns Buy quote data including token amount out, slippage, and enhanced error states
 */
function validateInputs(tokenAddress: string | undefined, usdcAmount: string): {
  isValid: boolean;
  error?: BuyQuoteError;
  parsedAmount?: bigint;
} {
  // Validate token address
  if (!tokenAddress || !isAddress(tokenAddress)) {
    return {
      isValid: false,
      error: {
        name: 'InvalidAddress',
        message: 'Invalid token address provided',
        userFriendlyMessage: 'Invalid token selected. Please try again.',
        retryable: false
      }
    };
  }

  // Validate USDC amount
  const trimmedAmount = usdcAmount.trim();
  if (!trimmedAmount || trimmedAmount === '0' || trimmedAmount === '0.00') {
    return { isValid: false }; // Valid but empty state
  }

  // Check for valid number format
  const numericAmount = parseFloat(trimmedAmount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return {
      isValid: false,
      error: {
        name: 'InvalidAmount',
        message: `Invalid USDC amount: ${usdcAmount}`,
        userFriendlyMessage: 'Please enter a valid amount.',
        retryable: false
      }
    };
  }

  // Check for reasonable limits (max 1M USDC)
  if (numericAmount > 1000000) {
    return {
      isValid: false,
      error: {
        name: 'AmountTooLarge',
        message: 'Amount exceeds maximum limit',
        userFriendlyMessage: 'Amount is too large. Maximum is 1,000,000 USDC.',
        retryable: false
      }
    };
  }

  // Check for too small amounts (less than $0.01)
  if (numericAmount < 0.01) {
    return {
      isValid: false,
      error: {
        name: 'AmountTooSmall',
        message: 'Amount is below minimum threshold',
        userFriendlyMessage: 'Minimum amount is $0.01 USDC.',
        retryable: false
      }
    };
  }

  try {
    const parsedAmount = parseUnits(trimmedAmount, USDC_DECIMALS);
    return {
      isValid: true,
      parsedAmount
    };
  } catch (error) {
    return {
      isValid: false,
      error: {
        name: 'ParseError',
        message: 'Failed to parse USDC amount',
        userFriendlyMessage: 'Invalid amount format. Please check your input.',
        retryable: false
      }
    };
  }
}

function createUserFriendlyError(error: unknown): BuyQuoteError {
  // Network-related errors
  const errorObj = error as { message?: string; code?: string | number };
  if (errorObj?.message?.includes('network') || errorObj?.message?.includes('RPC')) {
    return {
      name: 'NetworkError',
      message: errorObj?.message || String(error),
      userFriendlyMessage: 'Network connection issue. Please check your connection and try again.',
      retryable: true
    };
  }

  // Contract-related errors
  if (errorObj?.message?.includes('contract') || errorObj?.message?.includes('revert')) {
    return {
      name: 'ContractError',
      message: errorObj?.message || String(error),
      userFriendlyMessage: 'Transaction would fail. This may be due to insufficient liquidity or market conditions.',
      retryable: true
    };
  }

  // Rate limiting
  if (errorObj?.message?.includes('rate limit') || errorObj?.message?.includes('429')) {
    return {
      name: 'RateLimitError',
      message: errorObj?.message || String(error),
      userFriendlyMessage: 'Too many requests. Please wait a moment and try again.',
      retryable: true
    };
  }

  // Generic fallback
  return {
    name: 'UnknownError',
    message: errorObj?.message || 'Unknown error occurred',
    userFriendlyMessage: 'Something went wrong. Please try again.',
    retryable: true
  };
}
export function useBuyQuote({
  tokenAddress,
  usdcAmount,
  enabled = true
}: UseBuyQuoteParams): BuyQuoteResult {
  // Validate inputs with comprehensive error handling
  const validation = useMemo(() => 
    validateInputs(tokenAddress, usdcAmount), 
    [tokenAddress, usdcAmount]
  );

  // Slippage tolerance (10% = 9000 basis points out of 10000)
  // Increased from 5% to handle low liquidity scenarios
  const slippageTolerance = 9000n;

  const shouldFetch = enabled && validation.isValid && !!validation.parsedAmount && validation.parsedAmount > 0n;

  const { data, isLoading, isError, error, isFetching } = useReadContract({
    address: MULTICALL_ADDRESS,
    abi: MULTICALL_ABI,
    functionName: 'buyQuoteIn',
    args: shouldFetch ? [tokenAddress as Address, validation.parsedAmount!, slippageTolerance] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: shouldFetch,
      staleTime: 1000 * 10, // 10 seconds - longer for better caching
      cacheTime: 1000 * 60 * 5, // 5 minutes cache
      refetchInterval: false,
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

  // Format token amount out (18 decimals) with error handling
  const tokenAmtOut = useMemo(() => {
    if (!data || !data[0]) return '0';
    try {
      // Log quote details for debugging
      if (data && validation.parsedAmount) {
        // Slippage is returned as a bigint that needs to be divided by 10^18 to get the decimal value
        const slippageRaw = data[1] as bigint;
        const slippageDecimal = Number(formatUnits(slippageRaw, 18));
        const slippagePercent = slippageDecimal * 100;
        
        const tokenOut = data[0] as bigint;
        const minTokenOut = data[2] as bigint;
        const autoMinTokenOut = data[3] as bigint;
        
        
        // Validation checks
        
        // Warn if price impact is high (more than 5%)
      }
      
      return formatUnits(data[0] as bigint, 18);
    } catch (error) {
      return '0';
    }
  }, [data, validation.parsedAmount]);

  // Enhanced error handling
  const enhancedError = useMemo(() => {
    if (validation.error) return validation.error;
    if (error) return createUserFriendlyError(error);
    return null;
  }, [validation.error, error]);

  // Determine if we have a valid quote
  const hasValidQuote = !!(data && data[0] && data[0] > 0n);
  const isEmpty = !validation.isValid && !validation.error; // Valid empty state (e.g., "0.00")

  return {
    tokenAmtOut,
    rawTokenAmtOut: data ? (data[0] as bigint) : undefined,
    slippage: data ? (data[1] as bigint) : undefined,
    minTokenAmtOut: data ? (data[2] as bigint) : undefined,
    autoMinTokenAmtOut: data ? (data[3] as bigint) : undefined,
    isLoading,
    isError: isError || !!validation.error,
    error: enhancedError,
    isValidating: isFetching && !isLoading, // Revalidating existing data
    isEmpty,
    hasValidQuote
  };
}

/**
 * Enhanced hook to get buy quote with debounced input
 * Prevents excessive RPC calls while user is typing
 * Includes optimized delay based on input state
 */
export function useDebouncedBuyQuote({
  tokenAddress,
  usdcAmount,
  enabled = true,
  delay = 300
}: UseBuyQuoteParams & { delay?: number }): BuyQuoteResult {
  const [debouncedAmount, setDebouncedAmount] = useState(usdcAmount);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Optimized debounce with immediate validation for empty states
  const debouncedSetAmount = useCallback(
    debounce((amount: string) => {
      setDebouncedAmount(amount);
      setIsDebouncing(false);
    }, delay),
    [delay]
  );

  useEffect(() => {
    // Immediate update for empty states to improve UX
    if (!usdcAmount || usdcAmount === '0' || usdcAmount === '0.00') {
      setDebouncedAmount(usdcAmount);
      setIsDebouncing(false);
      return;
    }

    // Debounce non-empty values
    setIsDebouncing(true);
    debouncedSetAmount(usdcAmount);

    // Cleanup on unmount
    return () => {
      debouncedSetAmount.cancel();
    };
  }, [usdcAmount, debouncedSetAmount]);

  const result = useBuyQuote({
    tokenAddress,
    usdcAmount: debouncedAmount,
    enabled
  });

  // Show loading state while debouncing and there's a pending change
  const isLoadingWithDebounce = result.isLoading || (isDebouncing && usdcAmount !== debouncedAmount);

  return {
    ...result,
    isLoading: isLoadingWithDebounce
  };
}