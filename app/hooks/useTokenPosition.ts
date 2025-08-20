import { useState, useEffect } from 'react';
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
}

export function useTokenPosition(
  tokenAddress: string | undefined,
  userAddress: string | undefined
): UseTokenPositionReturn {
  const [tokenPosition, setTokenPosition] = useState<TokenPositionData | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tokenAddress || !userAddress) {
      setTokenPosition(null);
      setTokenData(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Create the composite ID for tokenPosition (tokenAddress-userAddress)
        // Use lowercase to match how the subgraph stores addresses from toHexString()
        const tokenPositionId = `${tokenAddress.toLowerCase()}-${userAddress.toLowerCase()}`;
        
        console.log('=== Fetching TokenPosition ===');
        console.log('Token address:', tokenAddress);
        console.log('User address:', userAddress);
        console.log('TokenPosition ID:', tokenPositionId);
        
        const response = await executeGraphQLQuery<{
          tokenPositions: TokenPositionData[];
          tokens: TokenData[];
        }>(GET_TOKEN_POSITION_QUERY, {
          tokenPositionId: tokenPositionId,
          tokenAddress: tokenAddress.toLowerCase()
        });

        console.log('=== Response from Subgraph ===');
        console.log('Full response:', response);
        
        if (!response.data) {
          console.log('No data in response');
          setTokenPosition(null);
          setTokenData(null);
          return;
        }
        
        console.log('TokenPositions array:', response.data.tokenPositions);
        console.log('Tokens array:', response.data.tokens);
        
        // Get the first item from the arrays (should only be one with the ID filter)
        const tokenPosition = response.data.tokenPositions?.[0] || null;
        const token = response.data.tokens?.[0] || null;
        
        if (tokenPosition) {
          console.log('ContentOwned:', tokenPosition.contentOwned);
          console.log('ContentBalance:', tokenPosition.contentBalance);
        }

        setTokenPosition(tokenPosition);
        setTokenData(token);
      } catch (err: any) {
        console.error('=== Error Details ===');
        console.error('Full error:', err);
        console.error('Error response:', err?.response);
        console.error('Error message:', err?.message);
        
        // GraphQL errors might come in different formats
        if (err?.response?.errors || err?.response?.message === 'Not found' || err?.response?.status === 200) {
          console.log('No token position found for user - this is normal for new users or new tokens');
          setTokenPosition(null);
          setTokenData(null);
          // Don't set this as an error - it's expected behavior
        } else {
          console.error('Unexpected error fetching token position:', err);
          setError(err as Error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tokenAddress, userAddress]);

  return { tokenPosition, tokenData, isLoading, error };
}