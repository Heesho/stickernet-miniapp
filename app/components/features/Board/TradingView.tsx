"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "../../ui";
import { AnimatedNumber } from "../../ui/AnimatedNumber";
import { RobinhoodChart } from "../../ui/RobinhoodChart/RobinhoodChart";
import { useChartData } from "@/app/hooks/useChartData";
import { Timeframe, PriceDataPoint } from "../../ui/RobinhoodChart/RobinhoodChart.types";
import { formatUnits } from "viem";
import { BuyPage } from "./BuyPage";
import { SellPage } from "./SellPage";
import { useAccount } from "wagmi";
import { useRealTimeData } from "@/app/hooks/useRealTimeData";
import { usePriceAnimation, useNumberTicker } from "@/app/hooks/usePriceAnimation";
import { useTokenPosition } from "@/app/hooks/useTokenPosition";
import { formatNumber, formatCurrency, formatTokenAmount, formatPercentage, formatCompact, formatForAnimatedNumber } from "@/lib/utils/formatters";

interface TradingViewProps {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenPrice: string;
  priceChange24h: number;
  priceChangeAmount: string;
  priceChange1h?: number;
  userPosition?: {
    shares: number;
    marketValue: string;
  };
  todayVolume: string;
  onPriceHover?: (price: string | null, floorPrice: string | null) => void;
  tokenData?: any;
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
  };
  onTimeframeChange?: (timeframe: Timeframe, priceData: { priceChange: number; priceChangeAmount: string; label: string }) => void;
}

export function TradingView({
  tokenAddress,
  tokenSymbol,
  tokenName,
  tokenPrice,
  priceChange24h,
  priceChangeAmount,
  priceChange1h,
  userPosition,
  todayVolume,
  onPriceHover,
  tokenData,
  subgraphData,
  onTimeframeChange
}: TradingViewProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('LIVE');
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);
  const [isTradeMenuExpanded, setIsTradeMenuExpanded] = useState(false);
  const [showBuyPage, setShowBuyPage] = useState(false);
  const [showSellPage, setShowSellPage] = useState(false);
  const tradeMenuRef = useRef<HTMLDivElement>(null);
  
  // Get user account
  const { address: userAddress } = useAccount();
  
  // Use real-time data with automatic polling
  const { 
    tokenData: multicallData, 
    positionData: subgraphPositionData,
    chartData: liveChartData,
    forceRefresh,
    refreshAfterTransaction: baseRefreshAfterTransaction
  } = useRealTimeData({
    tokenAddress: tokenAddress as `0x${string}`,
    userAddress,
    enabled: !!tokenAddress,
    aggressivePolling: showBuyPage || showSellPage // More frequent updates during trading
  });
  
  // Fetch subgraph data for user creations and collection
  const { tokenPosition, tokenData: subgraphTokenData } = useTokenPosition(
    tokenAddress,
    userAddress
  );
  
  // Price animations
  const { animationClass, priceDirection } = usePriceAnimation(
    multicallData?.marketPrice ? formatUnits(multicallData.marketPrice, 6) : tokenPrice,
    tokenAddress
  );
  
  // Number ticker animation for price display
  const { displayValue: animatedPrice } = useNumberTicker(
    hoveredPrice !== null ? hoveredPrice : parseFloat(tokenPrice),
    600
  );
  
  // Debug logging
  useEffect(() => {
    if (tokenPosition) {
      console.log('TokenPosition data received:', tokenPosition);
      console.log('Content owned:', tokenPosition.contentOwned);
      console.log('Content balance:', tokenPosition.contentBalance);
    }
  }, [tokenPosition]);
  
  // Track the calculated price change for the selected timeframe
  const [timeframePriceChange, setTimeframePriceChange] = useState<number | null>(null);
  
  // Dynamic theme colors based on selected timeframe price performance
  // Use calculated timeframe change if available, otherwise fall back to props
  let isPricePositive = true;
  if (timeframePriceChange !== null) {
    isPricePositive = timeframePriceChange >= 0;
  } else if (selectedTimeframe === 'LIVE' && priceChange1h !== undefined) {
    isPricePositive = priceChange1h >= 0;
  } else if (priceChange24h !== undefined) {
    isPricePositive = priceChange24h >= 0;
  }
  
  const themeColor = isPricePositive ? '#0052FF' : '#FF6B35';
  const themeBgClass = isPricePositive ? 'bg-[#0052FF]' : 'bg-[#FF6B35]';
  const themeColorClass = isPricePositive ? 'text-[#0052FF]' : 'text-[#FF6B35]';
  const themeBorderClass = isPricePositive ? 'border-[#0052FF]' : 'border-[#FF6B35]';
  
  // Fetch chart data from subgraph
  const { data: chartData, loading: chartLoading, error: chartError, refetch: refetchChart } = useChartData({
    tokenAddress,
    timeframe: selectedTimeframe,
    enabled: true
  });
  
  // Calculate price change based on selected timeframe and chart data
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      const currentPrice = parseFloat(tokenPrice);
      const firstDataPoint = chartData[0];
      const priceChange = ((currentPrice - firstDataPoint.marketPrice) / firstDataPoint.marketPrice) * 100;
      const priceChangeAmount = (currentPrice - firstDataPoint.marketPrice).toFixed(6);
      
      // Update local state for theme
      setTimeframePriceChange(priceChange);
      
      // Determine the label based on timeframe
      let label = 'last hour';
      switch (selectedTimeframe) {
        case 'LIVE': label = 'last hour'; break;
        case '4H': label = 'last 4 hours'; break;
        case '1D': label = 'today'; break;
        case '1W': label = 'last week'; break;
        case '1M': label = 'last month'; break;
        case 'MAX': label = 'all time'; break;
      }
      
      if (onTimeframeChange) {
        onTimeframeChange(selectedTimeframe, { priceChange, priceChangeAmount, label });
      }
    }
  }, [selectedTimeframe, chartData, tokenPrice, onTimeframeChange]);
  
  // Enhanced refresh function that also refreshes chart data
  const refreshAfterTransaction = async (txHash?: string) => {
    console.log('Transaction completed, refreshing all data including chart...');
    // Call base refresh
    await baseRefreshAfterTransaction(txHash);
    // Also refresh chart data
    setTimeout(() => {
      console.log('Refreshing chart data...');
      refetchChart();
    }, 1000);
    // Additional delayed refresh for chart
    setTimeout(() => {
      console.log('Second chart refresh...');
      refetchChart();
    }, 5000);
  };

  const handlePriceHover = (dataPoint: PriceDataPoint | null) => {
    const price = dataPoint ? dataPoint.marketPrice : null;
    const floorPrice = dataPoint ? dataPoint.floorPrice : null;
    setHoveredPrice(price);
    onPriceHover?.(
      price ? price.toFixed(6) : null,
      floorPrice ? floorPrice.toFixed(6) : null
    );
  };

  const displayPrice = animatedPrice;
  
  // Calculate position data from multicall
  const positionData = useMemo(() => {
    if (!multicallData) {
      return {
        shares: '0',
        marketValue: '0.00',
        credit: '0.00',
        debt: '0.00'
      };
    }
    
    const shares = multicallData.accountTokenBalance 
      ? parseFloat(formatUnits(multicallData.accountTokenBalance, 18))
      : 0;
    const marketValue = shares * parseFloat(tokenPrice);
    const credit = multicallData.accountCredit
      ? parseFloat(formatUnits(multicallData.accountCredit, 6))
      : 0;
    const debt = multicallData.accountDebt
      ? parseFloat(formatUnits(multicallData.accountDebt, 6))
      : 0;
    
    return {
      shares: formatTokenAmount(shares),
      marketValue: marketValue.toString(),  // Pass raw number as string
      credit: credit.toString(),  // Pass raw number as string
      debt: debt.toString()  // Pass raw number as string
    };
  }, [multicallData, tokenPrice]);
  
  // Calculate creations data from subgraph
  const creationsData = useMemo(() => {
    if (!tokenPosition) {
      return {
        stickers: '0',
        marketValue: '0.00',
        totalSteals: '0',
        totalReturn: '0.00'
      };
    }
    
    // Handle BigInt values that come as strings from subgraph
    const formatValue = (value: string | undefined, decimals: number = 2) => {
      if (!value || value === '0') return decimals > 0 ? '0.00' : '0';
      // If it's a BigInt string, we might need to divide by decimals
      return parseFloat(value).toFixed(decimals);
    };
    
    return {
      stickers: tokenPosition.contentCreated || '0',
      marketValue: tokenPosition.createdValue || '0',  // Pass raw value as string
      totalSteals: tokenPosition.createdCurations || '0',
      totalReturn: formatValue(tokenPosition.creatorRevenueQuote)
    };
  }, [tokenPosition]);
  
  // Calculate collection data from subgraph and multicall
  const collectionData = useMemo(() => {
    if (!tokenPosition || !subgraphTokenData) {
      return {
        stickers: '0',
        marketValue: '0.00',
        ownership: '0',
        claimable: '0.00',
        totalSpent: '0.00',
        totalReturn: '0.00'
      };
    }
    
    // Helper function to safely parse values
    const safeParseFloat = (value: string | undefined, defaultValue: number = 0) => {
      if (!value) return defaultValue;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    };
    
    const contentBalance = safeParseFloat(tokenPosition.contentBalance);
    const totalContentBalance = safeParseFloat(subgraphTokenData.contentBalance, 1); // Avoid division by zero
    const ownership = totalContentBalance > 0 ? (contentBalance / totalContentBalance * 100) : 0;
    
    const ownerRevenue = safeParseFloat(tokenPosition.ownerRevenueQuote);
    const curatorRevenueQuote = safeParseFloat(tokenPosition.curatorRevenueQuote);
    const curatorRevenueToken = safeParseFloat(tokenPosition.curatorRevenueToken);
    const marketPrice = safeParseFloat(subgraphTokenData.marketPrice, parseFloat(tokenPrice));
    const totalReturn = ownerRevenue + curatorRevenueQuote + (curatorRevenueToken * marketPrice);
    
    // Calculate claimable from multicall: accountQuoteEarned + (accountTokenEarned * marketPrice)
    let claimable = 0;
    if (multicallData) {
      const accountQuoteEarned = multicallData.accountQuoteEarned 
        ? parseFloat(formatUnits(multicallData.accountQuoteEarned, 6)) // USDC has 6 decimals
        : 0;
      const accountTokenEarned = multicallData.accountTokenEarned
        ? parseFloat(formatUnits(multicallData.accountTokenEarned, 18)) // Tokens have 18 decimals
        : 0;
      claimable = accountQuoteEarned + (accountTokenEarned * parseFloat(tokenPrice));
    }
    
    return {
      stickers: tokenPosition.contentOwned || '0',
      marketValue: contentBalance.toString(),  // Pass raw number as string
      ownership: formatNumber(ownership, 0, false),
      claimable: claimable.toString(),  // Pass raw number as string
      totalSpent: formatCurrency(safeParseFloat(tokenPosition.curationSpend)),
      totalReturn: formatCurrency(totalReturn)
    };
  }, [tokenPosition, subgraphTokenData, tokenPrice, multicallData]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tradeMenuRef.current && !tradeMenuRef.current.contains(event.target as Node)) {
        setIsTradeMenuExpanded(false);
      }
    };

    if (isTradeMenuExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTradeMenuExpanded]);

  return (
    <div className="animate-fade-in">
      {/* Robinhood-style Chart */}
      <div className="-mx-4 mb-8">
        <RobinhoodChart
          priceData={chartData || []}
          timeframe={selectedTimeframe}
          currentPrice={tokenPrice}
          onPriceHover={handlePriceHover}
          onTimeframeChange={(timeframe) => {
            setSelectedTimeframe(timeframe);
          }}
          height={320}
          priceChange24h={timeframePriceChange !== null ? timeframePriceChange : (priceChange1h !== undefined ? priceChange1h : priceChange24h)}
        />
      </div>

      {/* Trading content */}
      <div className="pb-20 space-y-6">

        {/* Your Position Section */}
        <div>
          <h3 className="text-white text-xl font-semibold mb-4">Your position</h3>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <div className="text-gray-500 text-sm mb-1">Shares</div>
              <div className="text-white text-lg">
                {positionData.shares}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Market value</div>
              <div className="text-white text-lg">
                <AnimatedNumber 
                  value={positionData.marketValue}
                  prefix="$"
                  decimals={2}
                  duration={600}
                  className={animationClass}
                />
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Credit</div>
              <div className="text-white text-lg">
                <AnimatedNumber 
                  value={positionData.credit}
                  prefix="$"
                  decimals={2}
                  duration={600}
                />
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Debt</div>
              <div className="text-white text-lg">
                <AnimatedNumber 
                  value={positionData.debt}
                  prefix="$"
                  decimals={2}
                  duration={600}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Your Creations Section */}
        <div>
          <h3 className="text-white text-xl font-semibold mb-4">Your creations</h3>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <div className="text-gray-500 text-sm mb-1">Stickers</div>
              <div className="text-white text-lg">{creationsData.stickers}</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Market value</div>
              <div className="text-white text-lg">
                <AnimatedNumber 
                  value={creationsData.marketValue}
                  prefix="$"
                  decimals={2}
                  duration={600}
                  className={animationClass}
                />
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Total steals</div>
              <div className="text-white text-lg">{creationsData.totalSteals}</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Total return</div>
              <div className="text-white text-lg">{creationsData.totalReturn}</div>
            </div>
          </div>
        </div>

        {/* Your Collection Section */}
        <div>
          <h3 className="text-white text-xl font-semibold mb-4">Your collection</h3>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <div className="text-gray-500 text-sm mb-1">Stickers</div>
              <div className="text-white text-lg">{collectionData.stickers}</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Market value</div>
              <div className="text-white text-lg">
                <AnimatedNumber 
                  value={collectionData.marketValue}
                  prefix="$"
                  decimals={2}
                  duration={600}
                  className={animationClass}
                />
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Ownership</div>
              <div className="text-white text-lg">{collectionData.ownership}%</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Claimable</div>
              <div className="text-white text-lg">
                <AnimatedNumber 
                  value={collectionData.claimable}
                  prefix="$"
                  decimals={2}
                  duration={600}
                  className={animationClass}
                />
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Total spent</div>
              <div className="text-white text-lg">{collectionData.totalSpent}</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Total return</div>
              <div className="text-white text-lg">{collectionData.totalReturn}</div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div>
          <h3 className="text-white text-xl font-semibold mb-4">Stats</h3>
          
          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
            <div>
              <div className="text-gray-500 text-sm mb-1">Market cap</div>
              <div className="text-white text-lg">
                {tokenData?.marketCap ? formatCurrency(formatUnits(tokenData.marketCap, 6), 2, true) : formatCurrency(0)}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Liquidity</div>
              <div className="text-white text-lg">
                {tokenData?.liquidity ? formatCurrency(formatUnits(tokenData.liquidity, 6), 2, true) : formatCurrency(0)}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Supply</div>
              <div className="text-white text-lg">
                {tokenData?.maxSupply 
                  ? formatCompact(formatUnits(tokenData.maxSupply, 18))
                  : '0'}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Holders</div>
              <div className="text-white text-lg">
                {subgraphData?.holders ? formatNumber(subgraphData.holders, 0, false) : '0'}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Floor price</div>
              <div className="text-white text-lg">
                {(() => {
                  if (!tokenData?.floorPrice) return formatCurrency(0);
                  const value = parseFloat(formatUnits(tokenData.floorPrice, 18));
                  const decimals = value >= 1 ? 2 : value >= 0.01 ? 3 : 6;
                  return formatCurrency(value, decimals);
                })()}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Market price</div>
              <div className="text-white text-lg">
                {(() => {
                  if (!tokenData?.marketPrice) return formatCurrency(0);
                  const value = parseFloat(formatUnits(tokenData.marketPrice, 18));
                  const decimals = value >= 1 ? 2 : value >= 0.01 ? 3 : 6;
                  return formatCurrency(value, decimals);
                })()}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Stickers</div>
              <div className="text-white text-lg">
                {subgraphData?.contents ? formatNumber(subgraphData.contents, 0, false) : '0'}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Collection value</div>
              <div className="text-white text-lg">
                {subgraphData?.contentBalance 
                  ? formatCurrency(subgraphData.contentBalance)
                  : formatCurrency(0)}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Collection APR</div>
              <div className="text-white text-lg">
                {tokenData?.contentApr 
                  ? formatPercentage(parseFloat(formatUnits(tokenData.contentApr, 18)) * 100)
                  : '0%'}
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Section */}
        <div>
          <h3 className="text-white text-xl font-semibold mb-4">Rewards</h3>
          
          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
            <div>
              <div className="text-gray-500 text-sm mb-1">Creators</div>
              <div className="text-white text-lg">
                {subgraphData?.creatorRewardsQuote 
                  ? formatCurrency(subgraphData.creatorRewardsQuote)
                  : formatCurrency(0)}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Collectors</div>
              <div className="text-white text-lg">
                {(() => {
                  const curatorRewards = parseFloat(subgraphData?.curatorRewardsQuote || '0');
                  const contentRevenueQuote = parseFloat(subgraphData?.contentRevenueQuote || '0');
                  const contentRevenueToken = parseFloat(subgraphData?.contentRevenueToken || '0');
                  const marketPrice = tokenData?.marketPrice 
                    ? parseFloat(formatUnits(tokenData.marketPrice, 18))
                    : 0;
                  const total = curatorRewards + contentRevenueQuote + (contentRevenueToken * marketPrice);
                  return formatCurrency(total);
                })()}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Holders</div>
              <div className="text-white text-lg">
                {subgraphData?.holderRewardsQuote 
                  ? formatCurrency(subgraphData.holderRewardsQuote)
                  : formatCurrency(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky action button and volume - positioned above navbar */}
      <div className="fixed bottom-16 left-0 right-0 z-40">
        <div className="w-full max-w-md mx-auto bg-black px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Volume display */}
            <div>
              <div className="text-white text-sm opacity-70">
                Today's swap volume
              </div>
              <div className="text-white text-2xl font-bold">
                {formatCurrency(todayVolume)}
              </div>
            </div>
            
            {/* Trade button - always shown */}
              <div className="relative" ref={tradeMenuRef}>
                {/* Main Trade/Close button */}
                <button
                  onClick={() => setIsTradeMenuExpanded(!isTradeMenuExpanded)}
                  className={`${
                    isTradeMenuExpanded 
                      ? 'bg-transparent' 
                      : `${themeBgClass} text-black`
                  } border-2 ${themeBorderClass} hover:opacity-90 font-semibold py-2.5 px-8 rounded-xl min-w-[120px] transition-all duration-200 focus:outline-none active:opacity-80 relative z-10`}
                >
                  {isTradeMenuExpanded ? (
                    <span className={`${themeColorClass} text-lg`}>✕</span>
                  ) : (
                    'Trade'
                  )}
                </button>
                
                {/* Expanded Buy/Sell buttons - positioned absolutely above Trade button */}
                {isTradeMenuExpanded && (
                  <div className="absolute bottom-full right-0 mb-2 flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        setShowBuyPage(true);
                        setIsTradeMenuExpanded(false);
                      }}
                      className={`${themeBgClass} hover:opacity-90 text-black font-semibold py-2.5 px-8 rounded-xl min-w-[120px] focus:outline-none active:opacity-80 transition-all`}
                    >
                      Buy
                    </button>
                    <button 
                      onClick={() => {
                        setShowSellPage(true);
                        setIsTradeMenuExpanded(false);
                      }}
                      className={`${themeBgClass} hover:opacity-90 text-black font-semibold py-2.5 px-8 rounded-xl min-w-[120px] focus:outline-none active:opacity-80 transition-all`}
                    >
                      Sell
                    </button>
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* Buy Page Modal */}
      {showBuyPage && (
        <BuyPage
          tokenAddress={tokenAddress}
          tokenSymbol={tokenSymbol}
          tokenName={tokenName}
          tokenPrice={tokenPrice}
          onClose={() => setShowBuyPage(false)}
          onTransactionSuccess={refreshAfterTransaction}
          themeColor={themeColor}
        />
      )}

      {/* Sell Page Modal */}
      {showSellPage && (
        <SellPage
          tokenAddress={tokenAddress}
          tokenSymbol={tokenSymbol}
          tokenName={tokenName}
          tokenPrice={tokenPrice}
          onClose={() => setShowSellPage(false)}
          onTransactionSuccess={refreshAfterTransaction}
          themeColor={themeColor}
        />
      )}
    </div>
  );
}