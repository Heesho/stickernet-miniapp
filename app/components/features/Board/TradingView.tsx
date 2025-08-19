"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "../../ui";
import { RobinhoodChart } from "../../ui/RobinhoodChart/RobinhoodChart";
import { useChartData } from "@/app/hooks/useChartData";
import { Timeframe, PriceDataPoint } from "../../ui/RobinhoodChart/RobinhoodChart.types";
import { formatUnits } from "viem";
import { BuyPage } from "./BuyPage";
import { SellPage } from "./SellPage";

interface TradingViewProps {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenPrice: string;
  priceChange24h: number;
  priceChangeAmount: string;
  userPosition?: {
    shares: number;
    marketValue: string;
  };
  todayVolume: string;
  onPriceHover?: (price: string | null) => void;
}

export function TradingView({
  tokenAddress,
  tokenSymbol,
  tokenName,
  tokenPrice,
  priceChange24h,
  priceChangeAmount,
  userPosition,
  todayVolume,
  onPriceHover
}: TradingViewProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('LIVE');
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);
  const [isTradeExpanded, setIsTradeExpanded] = useState(false);
  const [showBuyPage, setShowBuyPage] = useState(false);
  const [showSellPage, setShowSellPage] = useState(false);
  const tradeMenuRef = useRef<HTMLDivElement>(null);
  
  const priceIsUp = priceChange24h >= 0;
  const themeColor = priceIsUp ? '#0052FF' : '#FF6B35';
  const themeBgClass = priceIsUp ? 'bg-[#0052FF]' : 'bg-[#FF6B35]';
  const themeColorClass = priceIsUp ? 'text-[#0052FF]' : 'text-[#FF6B35]';
  
  // Trading is always available now (no phases)

  // Fetch chart data from subgraph
  const { data: chartData, loading: chartLoading, error: chartError } = useChartData({
    tokenAddress,
    timeframe: selectedTimeframe,
    enabled: true
  });

  const handlePriceHover = (dataPoint: PriceDataPoint | null) => {
    const price = dataPoint ? dataPoint.marketPrice : null;
    setHoveredPrice(price);
    onPriceHover?.(price ? price.toFixed(6) : null);
  };

  const displayPrice = hoveredPrice !== null ? hoveredPrice : parseFloat(tokenPrice);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tradeMenuRef.current && !tradeMenuRef.current.contains(event.target as Node)) {
        setIsTradeExpanded(false);
      }
    };

    if (isTradeExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTradeExpanded]);

  return (
    <div className="animate-fade-in">
      {/* Robinhood-style Chart */}
      <div className="-mx-4 mb-8">
        <RobinhoodChart
          priceData={chartData}
          timeframe={selectedTimeframe}
          currentPrice={parseFloat(tokenPrice)}
          onPriceHover={handlePriceHover}
          onTimeframeChange={setSelectedTimeframe}
          height={320}
          priceChange24h={priceChange24h}
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
                {userPosition?.shares?.toLocaleString() || '232'}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Market value</div>
              <div className="text-white text-lg">
                ${userPosition?.marketValue || '3,343.98'}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Credit</div>
              <div className="text-white text-lg">
                $0.34
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Debt</div>
              <div className="text-white text-lg">
                $24.02
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
              <div className="text-white text-lg">3</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Market value</div>
              <div className="text-white text-lg">$2,122.23</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Total steals</div>
              <div className="text-white text-lg">89</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Total return</div>
              <div className="text-white text-lg">$432.23</div>
            </div>
          </div>
        </div>

        {/* Your Collection Section */}
        <div>
          <h3 className="text-white text-xl font-semibold mb-4">Your collection</h3>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <div className="text-gray-500 text-sm mb-1">Stickers</div>
              <div className="text-white text-lg">12</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Market value</div>
              <div className="text-white text-lg">$2,122.23</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Ownership</div>
              <div className="text-white text-lg">45%</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Claimable</div>
              <div className="text-white text-lg">$72.23</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Total spent</div>
              <div className="text-white text-lg">$1,245.00</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Total return</div>
              <div className="text-white text-lg">$432.23</div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div>
          <h3 className="text-white text-xl font-semibold mb-4">Stats</h3>
          
          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
            <div>
              <div className="text-gray-500 text-sm mb-1">Market cap</div>
              <div className="text-white text-lg">$232M</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Liquidity</div>
              <div className="text-white text-lg">$23.01</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Supply</div>
              <div className="text-white text-lg">949M</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Holders</div>
              <div className="text-white text-lg">1,232</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Floor price</div>
              <div className="text-white text-lg">$0.023</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Market price</div>
              <div className="text-white text-lg">$0.34</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Stickers</div>
              <div className="text-white text-lg">112</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Collection value</div>
              <div className="text-white text-lg">$1,000</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Total volume</div>
              <div className="text-white text-lg">$232</div>
            </div>
          </div>
        </div>

        {/* Rewards Section */}
        <div>
          <h3 className="text-white text-xl font-semibold mb-4">Rewards</h3>
          
          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
            <div>
              <div className="text-gray-500 text-sm mb-1">Creators</div>
              <div className="text-white text-lg">$535.12</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Collectors</div>
              <div className="text-white text-lg">$100.16</div>
            </div>
            
            <div>
              <div className="text-gray-500 text-sm mb-1">Holders</div>
              <div className="text-white text-lg">$232.12</div>
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
                ${todayVolume}
              </div>
            </div>
            
            {/* Trade button - always shown */}
              <div className="relative" ref={tradeMenuRef}>
                {/* Main Trade/Close button */}
                <button
                  onClick={() => setIsTradeExpanded(!isTradeExpanded)}
                  className={`${
                    isTradeExpanded 
                      ? 'bg-transparent' 
                      : `${themeBgClass} text-black`
                  } border-2 border-[#0052FF] hover:opacity-90 font-semibold py-2.5 px-8 rounded-xl min-w-[120px] transition-all duration-200 focus:outline-none active:opacity-80 relative z-10`}
                >
                  {isTradeExpanded ? (
                    <span className="text-[#0052FF] text-lg">✕</span>
                  ) : (
                    'Trade'
                  )}
                </button>
                
                {/* Expanded Buy/Sell buttons - positioned absolutely above Trade button */}
                {isTradeExpanded && (
                  <div className="absolute bottom-full right-0 mb-2 flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        setShowBuyPage(true);
                        setIsTradeExpanded(false);
                      }}
                      className="bg-[#0052FF] hover:bg-[#0052FF]/90 text-black font-semibold py-2.5 px-8 rounded-xl min-w-[120px] focus:outline-none active:bg-[#0052FF]/80 transition-colors"
                    >
                      Buy
                    </button>
                    <button 
                      onClick={() => {
                        setShowSellPage(true);
                        setIsTradeExpanded(false);
                      }}
                      className="bg-[#0052FF] hover:bg-[#0052FF]/90 text-black font-semibold py-2.5 px-8 rounded-xl min-w-[120px] focus:outline-none active:bg-[#0052FF]/80 transition-colors"
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
        />
      )}
    </div>
  );
}