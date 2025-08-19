"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from 'next/image';
import { useAccount } from "wagmi";
import dynamic from "next/dynamic";
import { Button, Icon } from "../../ui";
import { CreateSticker } from "./CreateSticker";
import { TradingView } from "./TradingView";
import { formatUnits } from "viem";

// Client-only OnchainKit Identity components to prevent hydration issues
const Avatar = dynamic(
  () => import("@coinbase/onchainkit/identity").then((mod) => ({ default: mod.Avatar })),
  { 
    ssr: false,
    loading: () => <div className="w-8 h-8 bg-[var(--app-gray)] animate-pulse rounded-full" />
  }
);

const Name = dynamic(
  () => import("@coinbase/onchainkit/identity").then((mod) => ({ default: mod.Name })),
  { 
    ssr: false,
    loading: () => <div className="w-16 h-4 bg-[var(--app-gray)] animate-pulse rounded" />
  }
);
import { CurateImage } from "../Home/CurateImage";
import { ImageDetail } from "../Home/ImageDetail";
import { 
  fetchTokenBoardData, 
  type Curate,
  type ContentPositionEntity 
} from "@/lib/constants";
import { useTokenData } from "@/app/hooks/useMulticall";
import type { BoardProps } from "./Board.types";

export function Board({ tokenId, tokenAddress, setActiveTab }: BoardProps) {
  const [boardData, setBoardData] = useState<{
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
      totalVolume: string;
      priceChange24h: number;
      priceChangeAmount: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurate, setSelectedCurate] = useState<Curate | null>(null);
  const [showCreateSticker, setShowCreateSticker] = useState(false);
  const [tokenAvatarError, setTokenAvatarError] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showTradingView, setShowTradingView] = useState(false);
  const [hoveredPrice, setHoveredPrice] = useState<string | null>(null);
  const symbolRef = useRef<HTMLDivElement>(null);
  const { address: account, isConnected } = useAccount();
  
  // Fetch token data from multicall - use 0x0 address if no account connected
  const { tokenData, isLoading: multicallLoading } = useTokenData({
    tokenAddress: tokenAddress as `0x${string}`,
    account: account || '0x0000000000000000000000000000000000000000' as `0x${string}`,
    enabled: !!tokenAddress
  });


  // Function to refresh board data
  const refreshBoardData = useCallback(async () => {
    if (!tokenAddress || !tokenData) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch board data from subgraph
      const boardDataFromSubgraph = await fetchTokenBoardData(tokenAddress.toLowerCase());
      
      if (!boardDataFromSubgraph) {
        setError('Token not found');
        setLoading(false);
        return;
      }
      
      // Transform content positions to curates format
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
      
      // Calculate today's volume and price change
      const todayVolume = boardDataFromSubgraph.contentDayData?.[0]?.volume || "0";
      
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
      
      setBoardData({
        token: {
          id: tokenAddress,
          name: tokenData.name,
          uri: tokenData.uri,
          price: parseFloat(formatUnits(tokenData.marketPrice || BigInt(0), 18)).toFixed(6),
          symbol: tokenData.symbol,
          owner: tokenData.owner
        },
        curates: curates,
        stats: {
          totalVolume: parseFloat(todayVolume).toLocaleString(),
          priceChange24h: priceChange24h,
          priceChangeAmount: priceChangeAmount
        }
      });
    } catch (err) {
      console.error('Error refreshing board data:', err);
      setError('Failed to refresh board data');
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, tokenData]);

  // Load board data from subgraph and multicall
  useEffect(() => {
    console.log('Board useEffect triggered', { 
      tokenAddress, 
      multicallLoading, 
      hasTokenData: !!tokenData,
      tokenDataKeys: tokenData ? Object.keys(tokenData) : 'none',
      loading
    });
    
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
        
        // Calculate today's volume from contentDayData
        const todayVolume = boardDataFromSubgraph.contentDayData?.[0]?.volume || "0";
        
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
              totalVolume: parseFloat(todayVolume).toLocaleString(),
              priceChange24h: priceChange24h,
              priceChangeAmount: priceChangeAmount
            }
          });
        }
      } catch (err) {
        console.error('Error loading board data:', err);
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
  }, [tokenAddress, multicallLoading, tokenData?.name, tokenData?.symbol, tokenData?.uri, tokenData?.owner, tokenData?.marketPrice?.toString()]);

  // Handle scroll for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBackToHome = () => {
    setActiveTab?.("home");
  };

  // Dynamic color theme based on price change (Robinhood-style)
  const priceIsUp = boardData?.stats?.priceChange24h ? boardData.stats.priceChange24h >= 0 : true;
  const themeColor = priceIsUp ? '#0052FF' : '#FF6B35'; // Blue when up, Orange when down
  const themeColorClass = priceIsUp ? 'text-[#0052FF]' : 'text-[#FF6B35]';
  const themeBgClass = priceIsUp ? 'bg-[#0052FF]' : 'bg-[#FF6B35]';
  const themeBorderClass = priceIsUp ? 'border-[#0052FF]' : 'border-[#FF6B35]';

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between p-4 mb-4">
          <div className="w-8 h-8 bg-[var(--app-gray)] animate-pulse rounded-lg"></div>
          <div className="w-24 h-6 bg-[var(--app-gray)] animate-pulse rounded"></div>
        </div>
        <div className="p-4 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-[var(--app-gray)] animate-pulse rounded-2xl"></div>
            <div className="flex-1">
              <div className="w-24 h-6 bg-[var(--app-gray)] animate-pulse rounded mb-2"></div>
              <div className="w-16 h-4 bg-[var(--app-gray)] animate-pulse rounded"></div>
            </div>
          </div>
        </div>
        <div className="columns-2 gap-4 px-4">
          {Array.from({length: 8}).map((_, i) => (
            <div key={i} className="mb-4 break-inside-avoid">
              <div className="bg-[var(--app-card-bg)] rounded-2xl overflow-hidden">
                <div 
                  className="w-full bg-[var(--app-gray)] animate-pulse rounded-2xl"
                  style={{ height: `${200 + (i % 3) * 100}px` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !boardData) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <Icon name="profile" size="lg" className="text-[var(--app-foreground-muted)] mx-auto mb-4" />
        <p className="text-[var(--app-foreground-muted)]">{error || 'Board not found'}</p>
        <Button 
          onClick={handleBackToHome} 
          variant="outline" 
          className="mt-4"
        >
          Back to Home
        </Button>
      </div>
    );
  }

  // Calculate opacity for the header symbol based on scroll position
  const headerSymbolOpacity = Math.min(scrollY / 100, 1);

  return (
    <div className="animate-fade-in min-h-screen pb-40">
      {/* Sticky Header with back button and view switcher */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <div className="w-full max-w-md mx-auto bg-black">
          <div className="relative flex items-center justify-between p-4">
            {/* Back button */}
            <button 
              onClick={handleBackToHome}
              className={`${themeColorClass} hover:opacity-80 transition-all z-10`}
              style={{ color: themeColor }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            
            {/* Symbol that fades in when scrolling - centered */}
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 text-white text-2xl font-bold transition-opacity duration-200"
              style={{ opacity: headerSymbolOpacity }}
            >
              {boardData.token.symbol || "PEPE"}
            </div>
            
            {/* View switcher button (board/token view) - shows grid when in trading, chart when in board */}
            <button 
              onClick={() => setShowTradingView(!showTradingView)}
              className={`w-9 h-9 ${themeBgClass} rounded-lg flex items-center justify-center text-white hover:opacity-90 transition-all z-10`}
            >
              {showTradingView ? (
                // Grid icon - to go back to board view
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                </svg>
              ) : (
                // Chart icon - to go to trading view
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18"/>
                  <path d="m7 16 4-8 4 8 5-5"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add spacing for the fixed header */}
      <div className="h-16"></div>

      {/* Token info section */}
      <div>
        {/* Token name, symbol, price and cover image */}
        <div className="flex justify-between items-start mb-4 mt-2">
          <div className="flex-1">
            <div className="text-white text-sm mb-1">
              {boardData.token.name}
            </div>
            <div ref={symbolRef} className="text-white text-5xl font-bold mb-2">
              {boardData.token.symbol || "PEPE"}
            </div>
            <div className="text-white text-3xl">
              ${hoveredPrice || boardData.token.price}
            </div>
          </div>
          
          {/* Token cover image */}
          <div className="ml-4">
            {!tokenAvatarError ? (
              <Image
                src={boardData.token.uri}
                alt={`${boardData.token.name} cover`}
                width={120}
                height={120}
                className="w-[120px] h-[120px] rounded-2xl object-cover"
                onError={() => setTokenAvatarError(true)}
              />
            ) : (
              <div className="w-[120px] h-[120px] bg-green-500 rounded-2xl flex items-center justify-center">
                <div className="w-10 h-10 bg-white rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* Price change indicator */}
        <div className="flex items-center mb-6">
          <div className={`flex items-center space-x-1 ${themeColorClass}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" 
                 className={boardData.stats.priceChange24h >= 0 ? '' : 'rotate-180'}>
              <path d="m7 14 5-5 5 5"/>
            </svg>
            <span className="text-base font-medium">
              ${Math.abs(parseFloat(boardData.stats.priceChangeAmount))} ({Math.abs(boardData.stats.priceChange24h).toFixed(2)}%)
            </span>
          </div>
          <span className="text-white opacity-70 text-base ml-2">Today</span>
        </div>

        {/* Board description and owner - only show in board view */}
        {!showTradingView && (
          <>
            {/* Board description */}
            <p className="text-white text-base mb-6">
              This is a description about this board where the creator can say... 
              <button className="text-white opacity-70 ml-2">more</button>
            </p>

            {/* Owner info and options */}
            <div className="flex items-center justify-between mb-8">
              {/* Owner with OnchainKit Identity */}
              <div className="flex items-center space-x-2">
                <Avatar 
                  address={boardData.token.owner as `0x${string}`} 
                  className="w-8 h-8" 
                />
                <Name 
                  address={boardData.token.owner as `0x${string}`} 
                  className="text-white text-base" 
                />
              </div>
              
              {/* Options button */}
              <button className="text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="19" cy="12" r="1"/>
                  <circle cx="5" cy="12" r="1"/>
                </svg>
              </button>
            </div>
          </>
        )}

      </div>

      {/* Board content grid or Trading View */}
      {!showTradingView ? (
        <div>
          <div className="columns-2 gap-4">
            {boardData.curates.map((curate, index) => (
              <CurateImage 
                key={curate.id} 
                curate={curate} 
                index={index}
                onImageClick={() => setSelectedCurate(curate)}
                isNew={false}
              />
            ))}
          </div>
        </div>
      ) : (
        <TradingView
          tokenAddress={tokenAddress || ''}
          tokenSymbol={boardData.token.symbol}
          tokenName={boardData.token.name}
          tokenPrice={boardData.token.price}
          priceChange24h={boardData.stats.priceChange24h}
          priceChangeAmount={boardData.stats.priceChangeAmount}
          userPosition={{
            shares: parseInt(tokenData?.accountTokenBalance?.toString() || '0') || 0,
            marketValue: ((parseInt(tokenData?.accountTokenBalance?.toString() || '0') || 0) * parseFloat(boardData.token.price)).toFixed(2)
          }}
          todayVolume={boardData.stats.totalVolume}
          onPriceHover={(price) => setHoveredPrice(price)}
        />
      )}

      {/* Sticky Create/Trade button and volume - positioned above navbar */}
      {!showTradingView && (
        <div className="fixed bottom-16 left-0 right-0">
          <div className="w-full max-w-md mx-auto bg-black px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Today's steal volume */}
              <div>
                <div className="text-white text-sm opacity-70">Today's steal volume</div>
                <div className="text-white text-2xl font-bold">
                  ${boardData.stats.totalVolume}
                </div>
              </div>
              
              {/* Create button */}
              <Button 
                onClick={() => setShowCreateSticker(true)}
                className={`${themeBgClass} hover:opacity-90 text-black font-semibold py-2.5 px-8 rounded-xl border-2 border-[#0052FF] min-w-[120px]`}
              >
                Stick
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedCurate && (
        <ImageDetail
          curate={selectedCurate}
          onClose={() => setSelectedCurate(null)}
          onCurate={() => {
            console.log('Curating:', selectedCurate);
          }}
        />
      )}

      {/* Create Sticker Modal */}
      {showCreateSticker && boardData && (
        <CreateSticker
          tokenAddress={tokenAddress || ''}
          tokenSymbol={boardData.token.symbol}
          tokenName={boardData.token.name}
          onClose={() => setShowCreateSticker(false)}
          onSuccess={() => {
            // Close the modal first
            setShowCreateSticker(false);
            
            // Wait a bit for the transaction to be indexed before refreshing
            setTimeout(() => {
              refreshBoardData();
            }, 3000); // Wait 3 seconds for indexing
          }}
        />
      )}
    </div>
  );
}