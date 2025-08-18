"use client";

import React, { useState, useEffect } from "react";
import { InteractiveChart } from "./InteractiveChart";
import { type PriceDataPoint, type Timeframe } from "./InteractiveChart.types";

/**
 * Example usage of the InteractiveChart component
 * This demonstrates how to integrate the chart with real-time data and handle user interactions
 */
export const InteractiveChartExample: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [currentPrice, setCurrentPrice] = useState(85.42);
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);

  // Generate mock data based on timeframe
  useEffect(() => {
    const generateMockData = (tf: Timeframe): PriceDataPoint[] => {
      const now = Date.now();
      let dataPoints = 50;
      let intervalMs = 60000; // 1 minute

      switch (tf) {
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
      let price = 80 + Math.random() * 20; // Starting price between 80-100
      let floorPrice = price * 0.8; // Floor price 20% below market

      for (let i = 0; i < dataPoints; i++) {
        const timestamp = now - (dataPoints - i - 1) * intervalMs;
        
        // Simulate price movement with some volatility
        const change = (Math.random() - 0.5) * 2; // -1 to 1
        price += change;
        price = Math.max(price, 50); // Minimum price
        
        // Floor price follows market price but with lag and smaller movements
        const floorChange = change * 0.3 + (Math.random() - 0.5) * 0.5;
        floorPrice += floorChange;
        floorPrice = Math.max(floorPrice, price * 0.7); // Floor never more than 30% below market
        
        // Volume varies randomly
        const volume = Math.random() * 1000000 + 100000;

        data.push({
          timestamp,
          marketPrice: price,
          floorPrice,
          volume,
        });
      }

      return data;
    };

    const mockData = generateMockData(timeframe);
    setPriceData(mockData);
    
    // Set current price to the latest price in the data
    if (mockData.length > 0) {
      setCurrentPrice(mockData[mockData.length - 1].marketPrice);
    }
  }, [timeframe]);

  // Simulate real-time updates for LIVE timeframe
  useEffect(() => {
    if (timeframe !== 'LIVE') return;

    const interval = setInterval(() => {
      setPriceData(prevData => {
        if (prevData.length === 0) return prevData;
        
        const lastPoint = prevData[prevData.length - 1];
        const change = (Math.random() - 0.5) * 1.5; // More volatile for live data
        const newPrice = Math.max(lastPoint.marketPrice + change, 50);
        const newFloorPrice = Math.max(lastPoint.floorPrice + change * 0.2, newPrice * 0.7);
        
        const newPoint: PriceDataPoint = {
          timestamp: Date.now(),
          marketPrice: newPrice,
          floorPrice: newFloorPrice,
          volume: Math.random() * 1000000 + 100000,
        };

        // Keep only last 60 points for LIVE view
        const newData = [...prevData.slice(-59), newPoint];
        
        // Update current price
        setCurrentPrice(newPrice);
        
        return newData;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [timeframe]);

  const handlePriceHover = (dataPoint: PriceDataPoint | null) => {
    if (dataPoint) {
      console.log('Hovering over:', {
        price: dataPoint.marketPrice,
        time: new Date(dataPoint.timestamp).toLocaleString(),
        volume: dataPoint.volume,
      });
    }
  };

  const handleTimeframeChange = (newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe);
  };

  return (
    <div className="p-4 bg-[var(--app-background)] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--app-foreground)] mb-2">
          Interactive Price Chart Demo
        </h1>
        <p className="text-[var(--app-foreground-muted)] mb-8">
          Hover over the chart to see price information. Switch timeframes to see different data ranges.
        </p>

        <div className="bg-[var(--app-card-bg)] rounded-2xl border border-[var(--app-card-border)] backdrop-blur-sm p-6 mb-8">
          <InteractiveChart
            priceData={priceData}
            timeframe={timeframe}
            currentPrice={currentPrice}
            onPriceHover={handlePriceHover}
            onTimeframeChange={handleTimeframeChange}
            height={400}
            showTimeframeSelector={true}
            showFloorPrice={true}
            enableRealTime={true}
            className="w-full"
          />
        </div>

        {/* Usage Instructions */}
        <div className="bg-[var(--app-card-bg)] rounded-2xl border border-[var(--app-card-border)] backdrop-blur-sm p-6">
          <h2 className="text-xl font-semibold text-[var(--app-foreground)] mb-4">
            Features Demonstrated
          </h2>
          <ul className="space-y-2 text-[var(--app-foreground-muted)]">
            <li>• Smooth SVG-based price curves with gradient fills</li>
            <li>• Interactive hover with vertical crosshair and price tooltips</li>
            <li>• Multiple timeframe support with different data intervals</li>
            <li>• Real-time updates on LIVE timeframe (every 5 seconds)</li>
            <li>• Market price and floor price lines</li>
            <li>• Responsive design that adapts to container width</li>
            <li>• Smooth animations and transitions</li>
            <li>• Grid lines and price axis labels</li>
            <li>• Mobile-friendly touch interactions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InteractiveChartExample;