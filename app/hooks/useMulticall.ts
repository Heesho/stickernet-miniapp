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

  // Type-safe data transformation
  const contentData: ContentData | undefined = data ? {
    tokenId: data.tokenId as TokenId,
    price: data.price as any,
    nextPrice: data.nextPrice as any,
    rewardForDuration: data.rewardForDuration as any,
    creator: data.creator,
    owner: data.owner,
    uri: data.uri
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

  // Debug logging in development only
  if (process.env.NODE_ENV === 'development') {
    console.log('Enhanced Multicall Request:', {
      tokenAddress,
      tokenId: tokenId?.toString(),
      shouldFetch,
      isLoading,
      isError,
      error: error?.message
    });

    if (contentData) {
      console.log('Enhanced Content Data:', {
        price,
        nextPrice,
        weeklyReward,
        creator: contentData.creator,
        owner: contentData.owner,
        uri: contentData.uri
      });
    }
  }

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
  enabled = true
}: UseTokenDataParams): UseTokenDataReturn {
  // Validate inputs with type guards
  const isValidTokenAddress = tokenAddress ? isAddress(tokenAddress) : false;
  const isValidAccount = account ? isAddress(account) : false;
  const shouldFetch = enabled && isValidTokenAddress && isValidAccount;

  const { data, isError, isLoading, error } = useReadContract({
    address: MULTICALL_ADDRESS,
    abi: MULTICALL_ABI,
    functionName: 'getTokenData',
    args: shouldFetch && tokenAddress && account ? [tokenAddress, account] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: shouldFetch,
      staleTime: 30 * 1000, // 30 seconds to prevent excessive refetching
      retry: (failureCount, error) => {
        // Don't retry on certain errors to prevent hydration issues
        if (error?.message?.includes('useLayoutEffect')) return false;
        return failureCount < 2;
      }
    }
  });

  // Type-safe data transformation
  const tokenData: TokenData | undefined = data ? {
    index: data.index,
    token: data.token,
    quote: data.quote,
    sale: data.sale,
    content: data.content,
    rewarder: data.rewarder,
    owner: data.owner,
    name: data.name,
    symbol: data.symbol,
    uri: data.uri,
    marketOpen: data.marketOpen,
    saleEnd: data.saleEnd,
    totalQuoteContributed: data.totalQuoteContributed as any,
    marketCap: data.marketCap as any,
    liquidity: data.liquidity as any,
    floorPrice: data.floorPrice as any,
    marketPrice: data.marketPrice as any,
    circulatingSupply: data.circulatingSupply as any,
    maxSupply: data.maxSupply as any,
    contentApr: data.contentApr as any,
    accountQuoteBalance: data.accountQuoteBalance as any,
    accountTokenBalance: data.accountTokenBalance as any,
    accountDebt: data.accountDebt as any,
    accountCredit: data.accountCredit as any,
    accountTransferrable: data.accountTransferrable as any,
    accountContributed: data.accountContributed as any,
    accountRedeemable: data.accountRedeemable as any,
    accountContentStaked: data.accountContentStaked as any,
    accountQuoteEarned: data.accountQuoteEarned as any,
    accountTokenEarned: data.accountTokenEarned as any,
    phase: data.phase
  } : undefined;

  return {
    tokenData,
    isLoading,
    isError,
    isSuccess: !isLoading && !isError && !!data,
    error: error || null
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