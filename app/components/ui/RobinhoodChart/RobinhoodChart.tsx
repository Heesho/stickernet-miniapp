"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { type RobinhoodChartProps, type PriceDataPoint, type Timeframe } from "./RobinhoodChart.types";

export const RobinhoodChart: React.FC<RobinhoodChartProps> = ({
  priceData,
  timeframe,
  currentPrice,
  onPriceHover,
  onTimeframeChange,
  height = 300,
  priceChange24h = 0,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: PriceDataPoint } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  const timeframes: Timeframe[] = ['LIVE', '4H', '1D', '1W', '1M', 'MAX'];

  // Determine color theme based on price change
  const isPositive = priceChange24h >= 0;
  const primaryColor = isPositive ? "#0052FF" : "#FF6B35";
  const gradientId = `gradient-${isPositive ? 'up' : 'down'}`;

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current?.parentElement) {
        const { width } = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);
  
  // Calculate chart path and points
  const { marketPath, floorPath, points, scales, isFlat } = useMemo(() => {
    if (dimensions.width === 0) {
      // Create default flat lines even without dimensions
      const defaultPath = 'M 0 150 L 400 150';
      return { 
        marketPath: defaultPath, 
        floorPath: defaultPath, 
        points: [], 
        scales: null, 
        isFlat: true 
      };
    }

    const padding = { top: 20, right: 0, bottom: 20, left: 0 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const chartHeight = dimensions.height - padding.top - padding.bottom;
    
    // Always use current price if available, fallback to data or default
    const fallbackPrice = parseFloat(currentPrice || '0.0001');
    
    // Check if all data points have the same price (flat line from no trading activity)
    const uniquePrices = new Set(priceData.map(d => d.marketPrice));
    const hasNoVolume = priceData.every(d => d.volume === 0);
    const isFlat = priceData.length > 0 && (uniquePrices.size === 1 || hasNoVolume);
    
    // For LIVE timeframe or no data, always show flat lines
    // This ensures chart is always visible
    if (!priceData.length || isFlat || (timeframe === 'LIVE' && priceData.length < 2)) {
      const price = currentPrice ? parseFloat(currentPrice) : fallbackPrice;
      const floorPrice = price * 0.95;
      
      // Create two points for a horizontal line
      const y = padding.top + chartHeight / 2;
      const floorY = padding.top + chartHeight * 0.6;
      
      const flatMarketPath = `M ${padding.left} ${y} L ${dimensions.width - padding.right} ${y}`;
      const flatFloorPath = `M ${padding.left} ${floorY} L ${dimensions.width - padding.right} ${floorY}`;
      
      return {
        marketPath: flatMarketPath,
        floorPath: flatFloorPath,
        points: [],
        scales: null,
        isFlat: true
      };
    }

    // Don't separate data - treat all as one continuous line
    // Find min and max values for scaling
    const allPrices = priceData.flatMap(d => [d.marketPrice, d.floorPrice]);
    
    // Use tighter scaling for better visualization
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    
    // Add padding based on the range size (less padding for smaller ranges)
    const range = maxPrice - minPrice;
    const paddingFactor = range < 0.0001 ? 1.1 : 1.05; // Less padding for small ranges
    
    const scaledMin = minPrice / paddingFactor;
    const scaledMax = maxPrice * paddingFactor;
    const priceRange = scaledMax - scaledMin || 0.00001;

    const minTime = priceData[0]?.timestamp || 0;
    const maxTime = priceData[priceData.length - 1]?.timestamp || 0;
    const timeRange = maxTime - minTime || 1;

    // Create scaling functions
    const xScale = (timestamp: number) => 
      padding.left + ((timestamp - minTime) / timeRange) * chartWidth;
    
    const yScale = (price: number) => 
      padding.top + chartHeight - ((price - scaledMin) / priceRange) * chartHeight;

    // Create points for the chart
    const chartPoints = priceData.map(d => ({
      x: xScale(d.timestamp),
      marketY: yScale(d.marketPrice),
      floorY: yScale(d.floorPrice),
      data: d,
    }));

    // Create smooth path using quadratic bezier curves
    const createSmoothPath = (points: { x: number; y: number }[]) => {
      if (points.length < 2) return '';
      
      let path = `M ${points[0].x} ${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpx = (prev.x + curr.x) / 2;
        
        path += ` Q ${cpx} ${prev.y}, ${cpx} ${(prev.y + curr.y) / 2} T ${curr.x} ${curr.y}`;
      }
      
      return path;
    };

    // Create paths for all data (including pre-creation at 0.00001)
    const marketPoints = chartPoints.map(p => ({ x: p.x, y: p.marketY }));
    const floorPoints = chartPoints.map(p => ({ x: p.x, y: p.floorY }));

    const marketPath = createSmoothPath(marketPoints);
    const floorPath = createSmoothPath(floorPoints);

    return {
      marketPath,
      floorPath,
      points: chartPoints,
      scales: { xScale, yScale, minPrice: scaledMin, maxPrice: scaledMax, minTime, maxTime },
      isFlat: false
    };
  }, [priceData, dimensions, currentPrice, timeframe]);

  // Handle mouse/touch interactions
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    // Don't handle any mouse events when flat
    if (!svgRef.current || !points.length || isFlat) {
      return;
    }

    const rect = svgRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    setMousePosition({ x, y });

    // Find closest point
    const closestPoint = points.reduce((closest, point) => {
      const distance = Math.abs(point.x - x);
      return distance < Math.abs(closest.x - x) ? point : closest;
    }, points[0]);

    if (closestPoint) {
      setHoveredPoint({ x: closestPoint.x, y: closestPoint.marketY, data: closestPoint.data });
      onPriceHover?.(closestPoint.data);
    }
  }, [points, onPriceHover, isFlat]);

  const handleMouseLeave = useCallback(() => {
    setMousePosition(null);
    setHoveredPoint(null);
    onPriceHover?.(null);
  }, [onPriceHover]);
  
  // Clear hover state immediately when chart becomes flat or data changes
  useEffect(() => {
    if (isFlat || !points.length) {
      setMousePosition(null);
      setHoveredPoint(null);
      onPriceHover?.(null);
    }
  }, [isFlat, points.length, onPriceHover]);

  // Format display values
  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Create area path for gradient fill
  const areaPath = useMemo(() => {
    if (!marketPath || !dimensions.width) return '';
    return `${marketPath} L ${dimensions.width} ${dimensions.height} L 0 ${dimensions.height} Z`;
  }, [marketPath, dimensions]);

  return (
    <div className="relative w-full">
      {/* Chart Container */}
      <div className="relative" style={{ height: `${height}px`, minHeight: '200px' }}>
        <svg
          ref={svgRef}
          width={dimensions.width || 400}
          height={dimensions.height || height}
          className="w-full"
          style={{ 
            display: 'block',
            cursor: isFlat || points.length === 0 ? 'default' : 'crosshair'
          }}
          onMouseMove={!isFlat && points.length > 0 ? handleMouseMove : undefined}
          onTouchMove={!isFlat && points.length > 0 ? handleMouseMove : undefined}
          onMouseLeave={!isFlat && points.length > 0 ? handleMouseLeave : undefined}
          onTouchEnd={!isFlat && points.length > 0 ? handleMouseLeave : undefined}
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill - only show if not flat */}
          {areaPath && !isFlat && (
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
              className="pointer-events-none"
            />
          )}

          {/* Floor price line (solid colored) - always show if path exists */}
          {floorPath ? (
            <path
              d={floorPath}
              fill="none"
              stroke={isPositive ? "rgba(0, 82, 255, 0.4)" : "rgba(255, 107, 53, 0.4)"}
              strokeWidth="1.5"
              className="pointer-events-none"
              opacity={isFlat ? 0.5 : 1}
              style={{ display: 'block' }}
            />
          ) : null}

          {/* Market price line - always show if path exists */}
          {marketPath ? (
            <path
              d={marketPath}
              fill="none"
              stroke={primaryColor}
              strokeWidth="2"
              className="pointer-events-none"
              opacity={isFlat ? 0.7 : 1}
              style={{ display: 'block' }}
            />
          ) : null}

          {/* Hover elements - only show when not flat and have real data points */}
          {mousePosition && hoveredPoint && !isFlat && points.length > 0 && (
            <>
              {/* Vertical line */}
              <line
                x1={hoveredPoint.x}
                y1={0}
                x2={hoveredPoint.x}
                y2={dimensions.height}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1"
                className="pointer-events-none"
              />

              {/* No hover circle - removed per user request */}
            </>
          )}
        </svg>

        {/* Hover tooltip - Time only - hide when flat or no points */}
        {hoveredPoint && !isFlat && points.length > 0 && (
          <div 
            className="absolute pointer-events-none z-10 bg-black/90 rounded-lg px-3 py-1.5 text-sm"
            style={{ 
              left: `${Math.min(hoveredPoint.x, dimensions.width - 100)}px`, 
              top: `${Math.max(hoveredPoint.y - 40, 10)}px` 
            }}
          >
            <div className="text-white text-xs">
              {formatTimestamp(hoveredPoint.data.timestamp)}
            </div>
          </div>
        )}

        {/* Loading state - only show when dimensions aren't set yet */}
        {dimensions.width === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500 text-sm">Loading chart...</div>
          </div>
        )}
        
      </div>

      {/* Timeframe Selector - Below Chart */}
      <div className="flex justify-center space-x-2 mt-4 px-4">
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange?.(tf)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
              timeframe === tf
                ? `${isPositive ? 'bg-[#0052FF]' : 'bg-[#FF6B35]'} text-black`
                : `${isPositive ? 'text-[#0052FF]' : 'text-[#FF6B35]'} hover:opacity-80`
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RobinhoodChart;