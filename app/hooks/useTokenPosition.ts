import { useState, useEffect, useCallback } from 'react';
import { executeGraphQLQuery } from '@/lib/constants';

const GET_TOKEN_POSITION_QUERY = `
  query GetTokenPosition($tokenPositionId: String!, $tokenAddress: String!) {
    tokenPositions(where: { id: $tokenPositionId }) {
      id
      contentCreated
      createdValue
      createdCurations
      creatorRevenueQuote
      contentOwned
      contentBalance
      curationSpend
      ownerRevenueQuote
      curatorRevenueQuote
      curatorRevenueToken
    }
    tokens(where: { id: $tokenAddress }) {
      id
      contentBalance
      marketPrice
    }
  }
`;

interface TokenPositionData {
  contentCreated: string;
  createdValue: string;
  createdCurations: string;
  creatorRevenueQuote: string;
  contentOwned: string;
  contentBalance: string;
  curationSpend: string;
  ownerRevenueQuote: string;
  curatorRevenueQuote: string;
  curatorRevenueToken: string;
}

interface TokenData {
  contentBalance: string;
  marketPrice: string;
}

interface UseTokenPositionReturn {
  tokenPosition: TokenPositionData | null;
  tokenData: TokenData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useTokenPosition(
  tokenAddress: string | undefined,
  userAddress: string | undefined
): UseTokenPositionReturn {
  const [tokenPosition, setTokenPosition] = useState<TokenPositionData | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!tokenAddress || !userAddress) {
      setTokenPosition(null);
      setTokenData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create the composite ID for tokenPosition (tokenAddress-userAddress)
      // Use lowercase to match how the subgraph stores addresses from toHexString()
      const tokenPositionId = `${tokenAddress.toLowerCase()}-${userAddress.toLowerCase()}`;
      
      
      const response = await executeGraphQLQuery<{
        tokenPositions: TokenPositionData[];
        tokens: TokenData[];
      }>(GET_TOKEN_POSITION_QUERY, {
        tokenPositionId: tokenPositionId,
        tokenAddress: tokenAddress.toLowerCase()
      });

      
      if (!response.data) {
        setTokenPosition(null);
        setTokenData(null);
        return;
      }
      
      
      // Get the first item from the arrays (should only be one with the ID filter)
      const tokenPosition = response.data.tokenPositions?.[0] || null;
      const token = response.data.tokens?.[0] || null;
      

      setTokenPosition(tokenPosition);
      setTokenData(token);
    } catch (err: unknown) {
      
      // GraphQL errors might come in different formats
      const error = err as { response?: { errors?: unknown; message?: string; status?: number } };
      if (error?.response?.errors || error?.response?.message === 'Not found' || error?.response?.status === 200) {
        setTokenPosition(null);
        setTokenData(null);
        // Don't set this as an error - it's expected behavior
      } else {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, userAddress]);

  useEffect(() => {
    fetchData();
  }, [tokenAddress, userAddress]);

  return { tokenPosition, tokenData, isLoading, error, refetch: fetchData };
}