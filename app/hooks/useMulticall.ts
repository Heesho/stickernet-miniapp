import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { MULTICALL_ADDRESS, MULTICALL_ABI, REWARD_DECIMALS, USDC_DECIMALS } from '@/lib/constants';
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
  enabled = true
}: UseContentDataParams): UseContentDataReturn {
  // Validate inputs with type guards
  const isValidAddress = tokenAddress ? isAddress(tokenAddress) : false;
  const isValidId = tokenId ? isValidTokenId(tokenId) : false;
  const shouldFetch = enabled && isValidAddress && isValidId;

  const { data, isError, isLoading, error } = useReadContract({
    address: MULTICALL_ADDRESS,
    abi: MULTICALL_ABI,
    functionName: 'getContentData',
    args: shouldFetch && tokenAddress && tokenId ? [tokenAddress, tokenId] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: shouldFetch
    }
  });

  // Transform raw multicall data to typed ContentData
  const contentData: ContentData | undefined = data ? {
    tokenId: data.tokenId as TokenId,
    price: data.price as Wei,
    nextPrice: data.nextPrice as Wei,
    rewardForDuration: data.rewardForDuration as Wei,
    creator: data.creator,
    owner: data.owner,
    uri: data.uri,
    isApproved: data.isApproved
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


  return {
    contentData,
    weeklyReward,
    price,
    nextPrice,
    isLoading,
    isError,
    isSuccess: !isLoading && !isError && !!data,
    error: error || null
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
      cacheTime,
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
    index: data.index,
    token: data.token,
    quote: data.quote,
    content: data.content,
    rewarder: data.rewarder,
    owner: data.owner,
    name: data.name,
    symbol: data.symbol,
    uri: data.uri,
    isModerated: data.isModerated,
    marketCap: data.marketCap as Wei,
    liquidity: data.liquidity as Wei,
    floorPrice: data.floorPrice as Wei,
    marketPrice: data.marketPrice as Wei,
    circulatingSupply: data.circulatingSupply,
    maxSupply: data.maxSupply,
    contentApr: data.contentApr,
    accountQuoteBalance: data.accountQuoteBalance as Wei,
    accountTokenBalance: data.accountTokenBalance,
    accountDebt: data.accountDebt as Wei,
    accountCredit: data.accountCredit as Wei,
    accountTransferrable: data.accountTransferrable,
    accountContentOwned: data.accountContentOwned,
    accountContentStaked: data.accountContentStaked,
    accountQuoteEarned: data.accountQuoteEarned as Wei,
    accountTokenEarned: data.accountTokenEarned,
    accountIsModerator: data.accountIsModerator
  } : undefined;

  return {
    tokenData,
    isLoading,
    isError,
    isSuccess: !isLoading && !isError && !!data,
    error: error || null,
    refetch
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
    tokenAddress,
    account: userAddress,
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