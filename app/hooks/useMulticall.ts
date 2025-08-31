import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { MULTICALL_ADDRESS, MULTICALL_ABI, REWARD_DECIMALS, USDC_DECIMALS } from '@/lib/constants';
import { useErrorHandler, type StandardError } from './useErrorHandler';
import type { 
  Address, 
  TokenId, 
  ContentData, 
  TokenData,
  UseContentDataParams,
  UseContentDataReturn,
  UseTokenDataParams,
  UseTokenDataReturn,
  ContractCallResult
} from '@/types';
import { isAddress, isValidTokenId } from '@/types';

/**
 * Enhanced hook for fetching content data with strict typing
 * @param params - Parameters including token address and ID
 * @returns Typed content data with loading and error states
 */
export function useContentData({
  tokenAddress,
  tokenId,
  enabled = true,
  refetchInterval = 0
}: UseContentDataParams & { refetchInterval?: number }): UseContentDataReturn {
  const errorHandler = useErrorHandler({
    hookName: 'useContentData',
    showToast: false, // Don't show toast for data fetching
    enableLogging: true,
    customErrorMapper: (error: unknown) => ({
      context: {
        tokenAddress,
        tokenId,
        enabled
      }
    })
  });

  // Validate inputs with type guards
  const isValidAddress = tokenAddress ? isAddress(tokenAddress) : false;
  const isValidId = tokenId ? isValidTokenId(tokenId) : false;
  const shouldFetch = enabled && isValidAddress && isValidId;

  const { data, isError, isLoading, error, refetch } = useReadContract({
    address: MULTICALL_ADDRESS,
    abi: MULTICALL_ABI,
    functionName: 'getContentData',
    args: shouldFetch && tokenAddress && tokenId ? [tokenAddress, tokenId] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: shouldFetch,
      refetchInterval: refetchInterval > 0 ? refetchInterval : false,
      staleTime: refetchInterval > 0 ? 0 : 5000
    }
  });

  // Transform raw multicall data to typed ContentData
  const contentData: ContentData | undefined = data ? {
    tokenId: (data as any).tokenId,
    price: (data as any).price,
    nextPrice: (data as any).nextPrice,
    rewardForDuration: (data as any).rewardForDuration,
    creator: (data as any).creator,
    owner: (data as any).owner,
    uri: (data as any).uri,
    isApproved: (data as any).isApproved
  } : undefined;

  // Safe formatting with proper decimal handling
  const weeklyReward = contentData?.rewardForDuration 
    ? formatUnits(contentData.rewardForDuration, REWARD_DECIMALS) 
    : '0';
  const nextPrice = contentData?.nextPrice 
    ? formatUnits(contentData.nextPrice, USDC_DECIMALS) 
    : '0';
  const price = contentData?.price 
    ? formatUnits(contentData.price, USDC_DECIMALS) 
    : '0';


  // Handle errors through error handler
  if (error) {
    errorHandler.handleError(error);
  }

  return {
    contentData,
    weeklyReward,
    price,
    nextPrice,
    isLoading,
    isError: isError || errorHandler.hasError,
    isSuccess: !isLoading && !isError && !errorHandler.hasError && !!data,
    error: error || null,
    refetch
  };
}

/**
 * Enhanced hook for fetching token data with strict typing
 * @param params - Parameters including token address and account
 * @returns Typed token data with loading and error states
 */
export function useTokenData({
  tokenAddress,
  account,
  enabled = true,
  refetchInterval = false,
  refetchIntervalInBackground = false,
  staleTime = 30_000,
  cacheTime = 5 * 60 * 1000
}: UseTokenDataParams & {
  refetchInterval?: number | false;
  refetchIntervalInBackground?: boolean;
  staleTime?: number;
  cacheTime?: number;
}): UseTokenDataReturn {
  // Validate inputs with type guards
  const isValidTokenAddress = tokenAddress ? isAddress(tokenAddress) : false;
  const isValidAccount = account ? isAddress(account) : false;
  const shouldFetch = enabled && isValidTokenAddress && isValidAccount;

  const { data, isError, isLoading, error, refetch } = useReadContract({
    address: MULTICALL_ADDRESS,
    abi: MULTICALL_ABI,
    functionName: 'getTokenData',
    args: shouldFetch && tokenAddress && account ? [tokenAddress, account] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: shouldFetch,
      staleTime,
      gcTime: cacheTime,
      refetchInterval,
      refetchIntervalInBackground,
      retry: (failureCount, error) => {
        // Don't retry on hydration-related errors
        if (error?.message?.includes('useLayoutEffect')) return false;
        return failureCount < 2;
      }
    }
  });

  // Transform raw multicall data to typed TokenData
  const tokenData: TokenData | undefined = data ? {
    index: (data as any).index,
    token: (data as any).token,
    quote: (data as any).quote,
    content: (data as any).content,
    rewarder: (data as any).rewarder,
    owner: (data as any).owner,
    name: (data as any).name,
    symbol: (data as any).symbol,
    uri: (data as any).uri,
    isModerated: (data as any).isModerated,
    marketCap: (data as any).marketCap,
    liquidity: (data as any).liquidity,
    floorPrice: (data as any).floorPrice,
    marketPrice: (data as any).marketPrice,
    circulatingSupply: (data as any).circulatingSupply,
    maxSupply: (data as any).maxSupply,
    contentApr: (data as any).contentApr,
    accountQuoteBalance: (data as any).accountQuoteBalance,
    accountTokenBalance: (data as any).accountTokenBalance,
    accountDebt: (data as any).accountDebt,
    accountCredit: (data as any).accountCredit,
    accountTransferrable: (data as any).accountTransferrable,
    accountContentOwned: (data as any).accountContentOwned,
    accountContentStaked: (data as any).accountContentStaked,
    accountQuoteEarned: (data as any).accountQuoteEarned,
    accountTokenEarned: (data as any).accountTokenEarned,
    accountIsModerator: (data as any).accountIsModerator
  } : undefined;

  return {
    tokenData,
    isLoading,
    isError,
    isSuccess: !isLoading && !isError && !!data,
    error: error || null,
    refetch: async () => {
      await refetch();
    }
  };
}

/**
 * Combined hook for fetching all multicall data with polling support
 */
export function useMulticall({
  tokenAddress,
  userAddress,
  refetchInterval = false,
  refetchIntervalInBackground = false,
  staleTime = 30_000,
  cacheTime = 5 * 60 * 1000
}: {
  tokenAddress: string;
  userAddress?: string;
  refetchInterval?: number | false;
  refetchIntervalInBackground?: boolean;
  staleTime?: number;
  cacheTime?: number;
}) {
  const tokenDataResult = useTokenData({
    tokenAddress: tokenAddress as Address,
    account: userAddress as Address | undefined,
    enabled: !!userAddress,
    refetchInterval,
    refetchIntervalInBackground,
    staleTime,
    cacheTime
  });

  return {
    tokenData: tokenDataResult.tokenData,
    isLoading: tokenDataResult.isLoading,
    isError: tokenDataResult.isError,
    error: tokenDataResult.error,
    refetch: async () => {
      // This would need to be implemented with queryClient
      // For now, return a promise that resolves
      return Promise.resolve();
    }
  };
}

/**
 * Utility function to create a contract call result wrapper
 * @param hookResult - Result from a wagmi hook
 * @returns Standardized contract call result
 */
export function createContractCallResult<T>(hookResult: {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}): ContractCallResult<T> {
  return {
    data: hookResult.data,
    isLoading: hookResult.isLoading,
    isError: hookResult.isError,
    error: hookResult.error ? {
      name: hookResult.error.name,
      message: hookResult.error.message,
      code: 'code' in hookResult.error ? String(hookResult.error.code) : undefined,
      data: 'data' in hookResult.error ? hookResult.error.data : undefined
    } : null
  };
}