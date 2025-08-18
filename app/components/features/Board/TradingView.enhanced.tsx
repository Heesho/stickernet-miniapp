"use client";

import { useState, useEffect } from "react";
import { Button, InteractiveChart } from "../../ui";
import { type PriceDataPoint, type Timeframe } from "../../ui/InteractiveChart";

interface TradingViewEnhancedProps {
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
}

/**
 * Enhanced TradingView component using the new InteractiveChart
 * This demonstrates how to integrate the chart with existing trading interface
 */
export function TradingViewEnhanced({
  tokenAddress,
  tokenSymbol,
  tokenName,
  tokenPrice,
  priceChange24h,
  priceChangeAmount,
  userPosition,
  todayVolume
}: TradingViewEnhancedProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1D');
  const [currentDisplayPrice, setCurrentDisplayPrice] = useState(parseFloat(tokenPrice));
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<PriceDataPoint | null>(null);
  
  const priceIsUp = priceChange24h >= 0;
  const themeColor = priceIsUp ? '#0052FF' : '#FF6B35';
  const themeBgClass = priceIsUp ? 'bg-[#0052FF]' : 'bg-[#FF6B35]';
  const themeColorClass = priceIsUp ? 'text-[#0052FF]' : 'text-[#FF6B35]';

  // Generate realistic price data based on current token price
  useEffect(() => {
    const generatePriceData = (timeframe: Timeframe): PriceDataPoint[] => {
      const basePrice = parseFloat(tokenPrice);
      const now = Date.now();
      let dataPoints = 50;
      let intervalMs = 60000;

      switch (timeframe) {
        case 'LIVE':
          dataPoints = 60;
          intervalMs = 60000; // 1 minute
          break;
        case '4H':
          dataPoints = 48;
          intervalMs = 5 * 60000; // 5 minutes
          break;
        case '1D':
          dataPoints = 48;
          intervalMs = 30 * 60000; // 30 minutes
          break;
        case '1W':
          dataPoints = 56;
          intervalMs = 3 * 60 * 60000; // 3 hours
          break;
        case '1M':
          dataPoints = 60;
          intervalMs = 12 * 60 * 60000; // 12 hours
          break;
        case 'MAX':
          dataPoints = 100;
          intervalMs = 24 * 60 * 60000; // 1 day
          break;
      }

      const data: PriceDataPoint[] = [];
      
      // Start from a slightly different price in the past and trend toward current price
      let price = basePrice * (0.9 + Math.random() * 0.2); // ±10% from current
      const targetPrice = basePrice;
      const priceStep = (targetPrice - price) / dataPoints;

      for (let i = 0; i < dataPoints; i++) {
        const timestamp = now - (dataPoints - i - 1) * intervalMs;
        
        // Add some randomness while trending toward target
        const randomChange = (Math.random() - 0.5) * basePrice * 0.02; // ±2% volatility
        price += priceStep + randomChange;
        
        // Ensure price doesn't go negative and stays within reasonable bounds
        price = Math.max(price, basePrice * 0.5);
        price = Math.min(price, basePrice * 1.5);
        
        const floorPrice = price * (0.75 + Math.random() * 0.15); // Floor 75-90% of market
        const volume = Math.random() * 1000000 + 100000;

        data.push({
          timestamp,
          marketPrice: price,
          floorPrice,
          volume,
        });
      }

      // Ensure the last point matches current price
      if (data.length > 0) {
        data[data.length - 1].marketPrice = basePrice;
      }

      return data;
    };

    const newData = generatePriceData(selectedTimeframe);
    setPriceData(newData);
  }, [selectedTimeframe, tokenPrice]);

  const handlePriceHover = (dataPoint: PriceDataPoint | null) => {
    setHoveredPoint(dataPoint);
    if (dataPoint) {
      setCurrentDisplayPrice(dataPoint.marketPrice);
    } else {
      setCurrentDisplayPrice(parseFloat(tokenPrice));
    }
  };

  const handleTimeframeChange = (timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe);
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(2)}K`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      ...(selectedTimeframe === 'LIVE' || selectedTimeframe === '4H' ? { 
        hour: '2-digit', 
        minute: '2-digit' 
      } : {})
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Price Header */}
      <div className="px-4 mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <h2 className="text-3xl font-bold text-white">
              {formatPrice(currentDisplayPrice)}
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-sm font-medium ${themeColorClass}`}>
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
              </span>
              <span className={`text-sm ${themeColorClass}`}>
                ({priceChange24h >= 0 ? '+' : ''}{priceChangeAmount})
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white opacity-70 text-sm">
              {hoveredPoint ? formatDate(hoveredPoint.timestamp) : 'Current'}
            </div>
            {hoveredPoint && (
              <div className="text-white opacity-70 text-xs mt-1">
                Volume: {hoveredPoint.volume.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Chart */}
      <div className="mb-6 -mx-4">
        <InteractiveChart
          priceData={priceData}
          timeframe={selectedTimeframe}
          currentPrice={parseFloat(tokenPrice)}
          onPriceHover={handlePriceHover}
          onTimeframeChange={handleTimeframeChange}
          height={280}
          showTimeframeSelector={true}
          showFloorPrice={true}
          enableRealTime={selectedTimeframe === 'LIVE'}
          className="w-full"
        />
      </div>

      {/* Trading content */}
      <div className="px-4 pb-4">
        {/* Your Position Section */}
        <div className="mb-8">
          <h3 className="text-white text-2xl font-bold mb-4">Your Position</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-white opacity-70 text-sm mb-1">Shares</div>
              <div className="text-white text-xl font-semibold">
                {userPosition?.shares?.toLocaleString() || '0'}
              </div>
            </div>
            
            <div>
              <div className="text-white opacity-70 text-sm mb-1">Market value</div>
              <div className="text-white text-xl font-semibold">
                ${userPosition?.marketValue || '0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Volume */}
        <div className="mb-8">
          <div className="text-white opacity-70 text-sm mb-1">Today's Volume</div>
          <div className="text-white text-2xl font-bold">
            ${todayVolume}
          </div>
        </div>
      </div>

      {/* Sticky Trade button and Today's Swap Volume - positioned above navbar */}
      <div className="fixed bottom-16 left-0 right-0">
        <div className="w-full max-w-md mx-auto bg-black px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Today's Swap Volume */}
            <div>
              <div className="text-white text-sm opacity-70">Today's Swap Volume</div>
              <div className="text-white text-2xl font-bold">
                ${todayVolume}
              </div>
            </div>
            
            {/* Trade button */}
            <Button 
              onClick={() => console.log('Open trade modal')}
              className={`${themeBgClass} hover:opacity-90 text-white font-semibold py-2.5 px-8 rounded-xl`}
            >
              Trade
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TradingViewEnhanced;