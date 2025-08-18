"use client";

import React, { useState } from "react";
import { RobinhoodChart } from "./RobinhoodChart";
import { type PriceDataPoint, type Timeframe } from "./RobinhoodChart.types";

// Sample data generator for demonstration
const generateSampleData = (timeframe: Timeframe): PriceDataPoint[] => {
  const now = Date.now();
  const dataPoints = timeframe === 'LIVE' ? 50 : timeframe === '4H' ? 100 : timeframe === '1D' ? 144 : 300;
  
  let timeInterval: number;
  switch (timeframe) {
    case 'LIVE':
      timeInterval = 30 * 1000; // 30 seconds
      break;
    case '4H':
      timeInterval = 2 * 60 * 1000; // 2 minutes
      break;
    case '1D':
      timeInterval = 10 * 60 * 1000; // 10 minutes
      break;
    case '1W':
      timeInterval = 60 * 60 * 1000; // 1 hour
      break;
    case '1M':
      timeInterval = 6 * 60 * 60 * 1000; // 6 hours
      break;
    case 'MAX':
      timeInterval = 24 * 60 * 60 * 1000; // 1 day
      break;
    default:
      timeInterval = 60 * 1000; // 1 minute
  }

  const data: PriceDataPoint[] = [];
  let basePrice = 2500; // Starting price
  let baseFloorPrice = 2000; // Starting floor price

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = now - (dataPoints - i) * timeInterval;
    
    // Simulate realistic price movement
    const priceChange = (Math.random() - 0.5) * 100;
    basePrice = Math.max(basePrice + priceChange, 1000); // Keep price above $1000
    
    // Floor price follows market price but with less volatility
    const floorChange = priceChange * 0.3;
    baseFloorPrice = Math.max(baseFloorPrice + floorChange, 800); // Keep floor above $800
    
    // Generate volume
    const volume = Math.floor(Math.random() * 10000) + 1000;

    data.push({
      timestamp,
      marketPrice: basePrice,
      floorPrice: baseFloorPrice,
      volume,
    });
  }

  return data;
};

export const RobinhoodChartExample: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [priceData, setPriceData] = useState<PriceDataPoint[]>(() => generateSampleData('1D'));
  const [hoveredPrice, setHoveredPrice] = useState<PriceDataPoint | null>(null);

  // Calculate 24h price change
  const priceChange24h = priceData.length >= 2 
    ? ((priceData[priceData.length - 1].marketPrice - priceData[0].marketPrice) / priceData[0].marketPrice) * 100
    : 0;

  const currentPrice = priceData.length > 0 ? priceData[priceData.length - 1].marketPrice : 2500;

  const handleTimeframeChange = (newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe);
    setPriceData(generateSampleData(newTimeframe));
  };

  const handlePriceHover = (dataPoint: PriceDataPoint | null) => {
    setHoveredPrice(dataPoint);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Robinhood-Style Chart Example
        </h2>
        
        <RobinhoodChart
          priceData={priceData}
          timeframe={timeframe}
          currentPrice={currentPrice}
          onPriceHover={handlePriceHover}
          onTimeframeChange={handleTimeframeChange}
          height={400}
          priceChange24h={priceChange24h}
        />

        {/* Additional Info */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Data Points:</span>
              <span className="ml-1 font-medium">{priceData.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Timeframe:</span>
              <span className="ml-1 font-medium">{timeframe}</span>
            </div>
            <div>
              <span className="text-gray-500">24h Change:</span>
              <span className={`ml-1 font-medium ${priceChange24h >= 0 ? 'text-[#0052FF]' : 'text-[#FF6B35]'}`}>
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Current:</span>
              <span className="ml-1 font-medium">${currentPrice.toFixed(2)}</span>
            </div>
          </div>
          
          {hoveredPrice && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">Hovered Data Point:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Market:</span>
                  <span className="ml-1">${hoveredPrice.marketPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Floor:</span>
                  <span className="ml-1">${hoveredPrice.floorPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Volume:</span>
                  <span className="ml-1">{hoveredPrice.volume.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Time:</span>
                  <span className="ml-1">{new Date(hoveredPrice.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RobinhoodChartExample;