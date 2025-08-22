import { useState, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { 
  fetchTokenBoardData, 
  type Curate,
  type ContentPositionEntity 
} from "@/lib/constants";
import { useMulticallAutoRefresh } from "@/app/hooks/useMulticallAutoRefresh";
import { TokenData, SubgraphDataPoint } from "@/types";

export interface BoardData {
  token: {
    id: string;
    name: string;
    uri: string;
    price: string;
    symbol: string;
    owner: string;
  };
  curates: Curate[];
  stats: {
    totalVolume: string;  // Steal volume
    swapVolume: string;   // Trading volume
    priceChange24h: number;
    priceChangeAmount: string;
    priceChange1h?: number;
  };
  subgraphData?: {
    holders?: string;
    contents?: string;
    contentBalance?: string;
    creatorRewardsQuote?: string;
    curatorRewardsQuote?: string;
    holderRewardsQuote?: string;
    contentRevenueQuote?: string;
    contentRevenueToken?: string;
    marketPrice?: string;
    floorPrice?: string;
  };
}

export interface UseBoardDataReturn {
  boardData: BoardData | null;
  loading: boolean;
  error: string | null;
  refreshBoardData: () => Promise<void>;
  tokenData: TokenData | null;
  multicallLoading: boolean;
  refreshAfterTransaction: () => Promise<void>;
}

export function useBoardData(tokenAddress?: string): UseBoardDataReturn {
  const { address: account } = useAccount();
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use simplified multicall auto-refresh hook
  const { 
    tokenData, 
    isLoading: multicallLoading,
    refreshAfterTransaction
  } = useMulticallAutoRefresh({
    tokenAddress: tokenAddress as `0x${string}`,
    account: account || '0x0000000000000000000000000000000000000000' as `0x${string}`,
    enabled: !!tokenAddress,
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  // Helper function to update board data from subgraph
  const updateBoardDataFromSubgraph = useCallback(async (boardDataFromSubgraph: { contentPositions: ContentPositionEntity[] }) => {
    if (!tokenData) return;
    
    // Transform subgraph content positions to app's curate format
    const curates: Curate[] = boardDataFromSubgraph.contentPositions.map((content: ContentPositionEntity) => ({
      id: content.id,
      tokenId: BigInt(content.tokenId),
      uri: content.uri,
      timestamp: Date.now().toString(),
      price: content.price,
      creator: content.creator,
      user: content.owner,
      token: {
        id: boardDataFromSubgraph.id,
        name: tokenData.name,
        symbol: tokenData.symbol,
        uri: tokenData.uri
      }
    }));
    
    // Calculate metrics
    // Use tokenDayData for swap volume (trading volume)
    const todaySwapVolume = boardDataFromSubgraph.tokenDayData?.[0]?.volume || "0";
    // Use contentDayData for steal volume (content curation volume)
    const todayStealVolume = boardDataFromSubgraph.contentDayData?.[0]?.volume || "0";
    
    let priceChange24h = 0;
    let priceChangeAmount = "0";
    
    if (boardDataFromSubgraph.tokenDayData?.length >= 2) {
      const currentPrice = parseFloat(boardDataFromSubgraph.marketPrice || "0");
      const yesterdayPrice = parseFloat(boardDataFromSubgraph.tokenDayData[1].marketPrice || "0");
      
      if (yesterdayPrice > 0) {
        priceChangeAmount = (currentPrice - yesterdayPrice).toFixed(6);
        priceChange24h = ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100;
      }
    }
    
    let priceChange1h = 0;
    
    if (boardDataFromSubgraph.tokenHourData?.length >= 2) {
      const currentPrice = parseFloat(boardDataFromSubgraph.marketPrice || "0");
      const hourAgoPrice = parseFloat(boardDataFromSubgraph.tokenHourData[1].marketPrice || "0");
      
      if (hourAgoPrice > 0) {
        priceChange1h = ((currentPrice - hourAgoPrice) / hourAgoPrice) * 100;
      }
    } else if (boardDataFromSubgraph.tokenHourData?.length === 1) {
      // If we only have current hour data, compare with opening price
      const currentPrice = parseFloat(boardDataFromSubgraph.marketPrice || "0");
      const openPrice = parseFloat(boardDataFromSubgraph.tokenHourData[0].marketPrice || "0");
      
      if (openPrice > 0) {
        priceChange1h = ((currentPrice - openPrice) / openPrice) * 100;
      }
    }
    
    // Only update if data has actually changed to prevent unnecessary re-renders
    setBoardData(prevData => {
      const newPrice = parseFloat(formatUnits(tokenData.marketPrice || BigInt(0), 18)).toFixed(6);
      
      // Check if price actually changed
      if (prevData && prevData.token.price === newPrice && 
          prevData.curates.length === curates.length) {
        // No significant changes, keep the same reference to prevent re-render
        return prevData;
      }
      
      return {
        token: {
          id: tokenAddress || '',
          name: tokenData.name,
          uri: tokenData.uri,
          price: newPrice,
          symbol: tokenData.symbol,
          owner: tokenData.owner
        },
        curates: curates,
        stats: {
          totalVolume: todayStealVolume,  // Steal volume for board view
          swapVolume: todaySwapVolume,    // Swap volume for trading view
          priceChange24h: priceChange24h,
          priceChangeAmount: priceChangeAmount,
          priceChange1h: priceChange1h
        },
        subgraphData: {
          holders: boardDataFromSubgraph.holders,
          contents: boardDataFromSubgraph.contents,
          contentBalance: boardDataFromSubgraph.contentBalance,
          creatorRewardsQuote: boardDataFromSubgraph.creatorRewardsQuote,
          curatorRewardsQuote: boardDataFromSubgraph.curatorRewardsQuote,
          holderRewardsQuote: boardDataFromSubgraph.holderRewardsQuote,
          contentRevenueQuote: boardDataFromSubgraph.contentRevenueQuote,
          contentRevenueToken: boardDataFromSubgraph.contentRevenueToken,
          marketPrice: boardDataFromSubgraph.marketPrice,
          floorPrice: boardDataFromSubgraph.floorPrice
        }
      };
    });
  }, [tokenAddress, tokenData]);

  // Simplified refresh function that only refreshes board data from subgraph
  const refreshBoardData = useCallback(async () => {
    if (!tokenAddress || !tokenData) return;
    
    try {
      
      // Fetch fresh subgraph data
      const boardDataFromSubgraph = await fetchTokenBoardData(tokenAddress.toLowerCase());
      
      if (boardDataFromSubgraph) {
        await updateBoardDataFromSubgraph(boardDataFromSubgraph);
      }
      
    } catch (err) {
      console.error('Error refreshing board data:', err);
      setError('Failed to refresh board data');
    }
  }, [tokenAddress, tokenData, updateBoardDataFromSubgraph]);

  // Load board data from subgraph and multicall with polling
  useEffect(() => {
    let isMounted = true;
    
    const loadBoardData = async () => {
      if (!tokenAddress || !tokenData) return;
      
      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }
        
        // Fetch board data from subgraph
        const boardDataFromSubgraph = await fetchTokenBoardData(tokenAddress.toLowerCase());
        
        if (!isMounted) return; // Component unmounted, don't update state
        
        if (!boardDataFromSubgraph) {
          setError('Token not found');
          return;
        }
        
        // Transform content positions to curates format
        const curates: Curate[] = boardDataFromSubgraph.contentPositions.map((content: ContentPositionEntity) => ({
          id: content.id,
          tokenId: BigInt(content.tokenId),
          uri: content.uri,
          timestamp: Date.now().toString(), // No timestamp in ContentPosition, using current time
          price: content.price,
          creator: content.creator,
          user: content.owner,
          token: {
            id: boardDataFromSubgraph.id,
            name: tokenData.name,
            symbol: tokenData.symbol,
            uri: tokenData.uri
          }
        }));
        
        // Calculate today's volumes
        const todaySwapVolume = boardDataFromSubgraph.tokenDayData?.[0]?.volume || "0";
        const todayStealVolume = boardDataFromSubgraph.contentDayData?.[0]?.volume || "0";
        
        // Calculate price change from tokenDayData
        let priceChange24h = 0;
        let priceChangeAmount = "0";
        
        if (boardDataFromSubgraph.tokenDayData?.length >= 2) {
          const currentPrice = parseFloat(boardDataFromSubgraph.marketPrice || "0");
          const yesterdayPrice = parseFloat(boardDataFromSubgraph.tokenDayData[1].marketPrice || "0");
          
          if (yesterdayPrice > 0) {
            priceChangeAmount = (currentPrice - yesterdayPrice).toFixed(6);
            priceChange24h = ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100;
          }
        } else if (boardDataFromSubgraph.tokenDayData?.length === 1) {
          // If we only have today's data, compare with opening price
          const currentPrice = parseFloat(boardDataFromSubgraph.marketPrice || "0");
          const openPrice = parseFloat(boardDataFromSubgraph.tokenDayData[0].marketPrice || "0");
          
          if (openPrice > 0) {
            priceChangeAmount = (currentPrice - openPrice).toFixed(6);
            priceChange24h = ((currentPrice - openPrice) / openPrice) * 100;
          }
        }
        
        // Calculate 1-hour price change for theme colors
        let priceChange1h = 0;
        
        if (boardDataFromSubgraph.tokenHourData?.length >= 2) {
          const currentPrice = parseFloat(boardDataFromSubgraph.marketPrice || "0");
          const hourAgoPrice = parseFloat(boardDataFromSubgraph.tokenHourData[1].marketPrice || "0");
          
          if (hourAgoPrice > 0) {
            priceChange1h = ((currentPrice - hourAgoPrice) / hourAgoPrice) * 100;
          }
        } else if (boardDataFromSubgraph.tokenHourData?.length === 1) {
          // If we only have current hour data, compare with opening price
          const currentPrice = parseFloat(boardDataFromSubgraph.marketPrice || "0");
          const openPrice = parseFloat(boardDataFromSubgraph.tokenHourData[0].marketPrice || "0");
          
          if (openPrice > 0) {
            priceChange1h = ((currentPrice - openPrice) / openPrice) * 100;
          }
        }
        
        if (isMounted) {
          // Use multicall data for token info
          setBoardData({
            token: {
              id: tokenAddress,
              name: tokenData.name,
              uri: tokenData.uri,
              price: parseFloat(formatUnits(tokenData.marketPrice || BigInt(0), 18)).toFixed(6), // Show 6 decimal places
              symbol: tokenData.symbol,
              owner: tokenData.owner
            },
            curates: curates,
            stats: {
              totalVolume: todayStealVolume,  // Steal volume for board view
              swapVolume: todaySwapVolume,    // Swap volume for trading view
              priceChange24h: priceChange24h,
              priceChangeAmount: priceChangeAmount,
              priceChange1h: priceChange1h
            },
            subgraphData: {
              holders: boardDataFromSubgraph.holders,
              contents: boardDataFromSubgraph.contents,
              contentBalance: boardDataFromSubgraph.contentBalance,
              creatorRewardsQuote: boardDataFromSubgraph.creatorRewardsQuote,
              curatorRewardsQuote: boardDataFromSubgraph.curatorRewardsQuote,
              holderRewardsQuote: boardDataFromSubgraph.holderRewardsQuote,
              contentRevenueQuote: boardDataFromSubgraph.contentRevenueQuote,
              contentRevenueToken: boardDataFromSubgraph.contentRevenueToken,
              marketPrice: boardDataFromSubgraph.marketPrice,
              floorPrice: boardDataFromSubgraph.floorPrice
            }
          });
        }
      } catch (err) {
        if (isMounted) {
          const isRateLimit = err instanceof Error && err.message.includes('Rate limit exceeded');
          if (isRateLimit) {
            setError('API rate limit exceeded. Please wait a few minutes and try again.');
          } else {
            setError('Failed to load board data');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Only load if we have the required data and multicall isn't loading
    if (!multicallLoading && tokenData && tokenAddress) {
      loadBoardData();
    }

    return () => {
      isMounted = false;
    };
  }, [tokenAddress, multicallLoading, tokenData?.name, tokenData?.symbol, tokenData?.uri, tokenData?.owner, tokenData?.marketPrice]);

  return {
    boardData,
    loading,
    error,
    refreshBoardData,
    tokenData,
    multicallLoading,
    refreshAfterTransaction
  };
}