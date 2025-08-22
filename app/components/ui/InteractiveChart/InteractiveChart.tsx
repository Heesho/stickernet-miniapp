"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { type InteractiveChartProps, type PriceDataPoint, type Timeframe, type ChartDimensions, type ScaleInfo, type HoverInfo } from "./InteractiveChart.types";

export const InteractiveChart: React.FC<InteractiveChartProps> = memo(({
  priceData,
  timeframe,
  currentPrice,
  onPriceHover,
  onTimeframeChange,
  className = "",
  height = 300,
  showTimeframeSelector = true,
  showFloorPrice = true,
  enableRealTime = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 400,
    height,
    padding: { top: 20, right: 20, bottom: 40, left: 60 },
  });
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const timeframes: Timeframe[] = ['LIVE', '4H', '1D', '1W', '1M', 'MAX'];

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions(prev => ({
          ...prev,
          width: Math.max(width, 300),
        }));
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate scales and ranges
  const scaleInfo = useMemo((): ScaleInfo => {
    if (!priceData.length) {
      return {
        xScale: (x) => x,
        yScale: (y) => y,
        minPrice: 0,
        maxPrice: 100,
        minTimestamp: Date.now(),
        maxTimestamp: Date.now(),
      };
    }

    const prices = priceData.flatMap(d => [d.marketPrice, ...(showFloorPrice ? [d.floorPrice] : [])]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const paddedMinPrice = minPrice - priceRange * 0.1;
    const paddedMaxPrice = maxPrice + priceRange * 0.1;

    const timestamps = priceData.map(d => d.timestamp);
    const minTimestamp = Math.min(...timestamps);
    const maxTimestamp = Math.max(...timestamps);

    const chartWidth = dimensions.width - dimensions.padding.left - dimensions.padding.right;
    const chartHeight = dimensions.height - dimensions.padding.top - dimensions.padding.bottom;

    const xScale = (timestamp: number) => {
      const ratio = (timestamp - minTimestamp) / (maxTimestamp - minTimestamp);
      return dimensions.padding.left + ratio * chartWidth;
    };

    const yScale = (price: number) => {
      const ratio = (price - paddedMinPrice) / (paddedMaxPrice - paddedMinPrice);
      return dimensions.height - dimensions.padding.bottom - ratio * chartHeight;
    };

    return {
      xScale,
      yScale,
      minPrice: paddedMinPrice,
      maxPrice: paddedMaxPrice,
      minTimestamp,
      maxTimestamp,
    };
  }, [priceData, dimensions, showFloorPrice]);

  // Generate smooth curve path
  const generatePath = useCallback((data: PriceDataPoint[], priceKey: 'marketPrice' | 'floorPrice'): string => {
    if (data.length < 2) return '';

    const points = data.map(d => ({
      x: scaleInfo.xScale(d.timestamp),
      y: scaleInfo.yScale(d[priceKey]),
    }));

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      // Use quadratic curves for smoothness
      if (i === 1) {
        const cp1x = prev.x + (curr.x - prev.x) * 0.5;
        const cp1y = prev.y;
        path += ` Q ${cp1x} ${cp1y} ${curr.x} ${curr.y}`;
      } else {
        const cp1x = prev.x + (curr.x - prev.x) * 0.5;
        const cp1y = prev.y;
        path += ` T ${curr.x} ${curr.y}`;
      }
    }

    return path;
  }, [scaleInfo]);

  // Generate area path for gradient fill
  const generateAreaPath = useCallback((data: PriceDataPoint[], priceKey: 'marketPrice' | 'floorPrice'): string => {
    const linePath = generatePath(data, priceKey);
    if (!linePath) return '';

    const firstPoint = data[0];
    const lastPoint = data[data.length - 1];
    const bottomY = dimensions.height - dimensions.padding.bottom;

    return `${linePath} L ${scaleInfo.xScale(lastPoint.timestamp)} ${bottomY} L ${scaleInfo.xScale(firstPoint.timestamp)} ${bottomY} Z`;
  }, [generatePath, scaleInfo, dimensions]);

  // Handle mouse movement
  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!priceData.length) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = event.clientX - rect.left;
    const chartStart = dimensions.padding.left;
    const chartEnd = dimensions.width - dimensions.padding.right;

    if (mouseX < chartStart || mouseX > chartEnd) {
      setHoverInfo(null);
      setIsHovering(false);
      onPriceHover?.(null);
      return;
    }

    // Find closest data point
    let closestIndex = 0;
    let minDistance = Infinity;

    priceData.forEach((point, index) => {
      const pointX = scaleInfo.xScale(point.timestamp);
      const distance = Math.abs(pointX - mouseX);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    const dataPoint = priceData[closestIndex];
    const x = scaleInfo.xScale(dataPoint.timestamp);
    const y = scaleInfo.yScale(dataPoint.marketPrice);

    const newHoverInfo: HoverInfo = {
      dataPoint,
      x,
      y,
      index: closestIndex,
    };

    setHoverInfo(newHoverInfo);
    setIsHovering(true);
    onPriceHover?.(dataPoint);
  }, [priceData, scaleInfo, dimensions, onPriceHover]);

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
    setIsHovering(false);
    onPriceHover?.(null);
  }, [onPriceHover]);

  // Memoize format functions to prevent recreation on every render
  const formatPrice = useCallback((price: number): string => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(2)}K`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  }, []);

  const formatTimestamp = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    
    if (timeframe === 'LIVE' || timeframe === '4H') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '1D') {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
    }
  }, [timeframe]);

  // Real-time updates for LIVE timeframe
  useEffect(() => {
    if (!enableRealTime || timeframe !== 'LIVE') return;

    const interval = setInterval(() => {
      // Trigger a re-render to potentially update the chart with new data
      // In a real implementation, this would fetch new data
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [enableRealTime, timeframe]);

  // Memoize expensive path calculations
  const marketPath = useMemo(() => generatePath(priceData, 'marketPrice'), [generatePath, priceData]);
  const marketAreaPath = useMemo(() => generateAreaPath(priceData, 'marketPrice'), [generateAreaPath, priceData]);
  const floorPath = useMemo(() => showFloorPrice ? generatePath(priceData, 'floorPrice') : '', [generatePath, priceData, showFloorPrice]);
  const floorAreaPath = useMemo(() => showFloorPrice ? generateAreaPath(priceData, 'floorPrice') : '', [generateAreaPath, priceData, showFloorPrice]);

  const displayPrice = isHovering && hoverInfo ? hoverInfo.dataPoint.marketPrice : currentPrice;
  const displayTimestamp = isHovering && hoverInfo ? hoverInfo.dataPoint.timestamp : Date.now();

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {/* Price Display */}
      <div className="mb-4 px-4">
        <div className="text-2xl font-bold text-[var(--app-foreground)]">
          {formatPrice(displayPrice)}
        </div>
        <div className="text-sm text-[var(--app-foreground-muted)]">
          {formatTimestamp(displayTimestamp)}
          {timeframe === 'LIVE' && enableRealTime && (
            <span className="ml-2 inline-flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Market price gradient */}
            <linearGradient id="marketGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--app-accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--app-accent)" stopOpacity="0.05" />
            </linearGradient>
            
            {/* Floor price gradient */}
            {showFloorPrice && (
              <linearGradient id="floorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
              </linearGradient>
            )}

            {/* Glow filter for hover line */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          <g className="opacity-20">
            {/* Horizontal grid lines */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
              const y = dimensions.height - dimensions.padding.bottom - 
                       ratio * (dimensions.height - dimensions.padding.top - dimensions.padding.bottom);
              return (
                <line
                  key={`h-grid-${i}`}
                  x1={dimensions.padding.left}
                  y1={y}
                  x2={dimensions.width - dimensions.padding.right}
                  y2={y}
                  stroke="var(--app-foreground-muted)"
                  strokeWidth="1"
                />
              );
            })}
            
            {/* Vertical grid lines */}
            {[0.25, 0.5, 0.75].map((ratio, i) => {
              const x = dimensions.padding.left + 
                       ratio * (dimensions.width - dimensions.padding.left - dimensions.padding.right);
              return (
                <line
                  key={`v-grid-${i}`}
                  x1={x}
                  y1={dimensions.padding.top}
                  x2={x}
                  y2={dimensions.height - dimensions.padding.bottom}
                  stroke="var(--app-foreground-muted)"
                  strokeWidth="1"
                />
              );
            })}
          </g>

          {/* Floor price area (behind market price) */}
          {showFloorPrice && floorAreaPath && (
            <path
              d={floorAreaPath}
              fill="url(#floorGradient)"
              className="transition-all duration-300"
            />
          )}

          {/* Market price area */}
          {marketAreaPath && (
            <path
              d={marketAreaPath}
              fill="url(#marketGradient)"
              className="transition-all duration-300"
            />
          )}

          {/* Floor price line */}
          {showFloorPrice && floorPath && (
            <path
              d={floorPath}
              stroke="#22c55e"
              strokeWidth="2"
              fill="none"
              className="transition-all duration-300"
            />
          )}

          {/* Market price line */}
          {marketPath && (
            <path
              d={marketPath}
              stroke="var(--app-accent)"
              strokeWidth="3"
              fill="none"
              className="transition-all duration-300"
            />
          )}

          {/* Hover line and tooltip */}
          {isHovering && hoverInfo && (
            <g className="transition-all duration-150">
              {/* Vertical hover line */}
              <line
                x1={hoverInfo.x}
                y1={dimensions.padding.top}
                x2={hoverInfo.x}
                y2={dimensions.height - dimensions.padding.bottom}
                stroke="var(--app-accent)"
                strokeWidth="1"
                strokeDasharray="4,4"
                filter="url(#glow)"
                className="animate-pulse"
              />
              
              {/* Hover point */}
              <circle
                cx={hoverInfo.x}
                cy={hoverInfo.y}
                r="6"
                fill="var(--app-accent)"
                stroke="var(--app-background)"
                strokeWidth="2"
                className="animate-pulse"
              />

              {/* Floor price hover point */}
              {showFloorPrice && (
                <circle
                  cx={hoverInfo.x}
                  cy={scaleInfo.yScale(hoverInfo.dataPoint.floorPrice)}
                  r="4"
                  fill="#22c55e"
                  stroke="var(--app-background)"
                  strokeWidth="2"
                />
              )}
            </g>
          )}

          {/* Price axis labels */}
          <g className="text-xs fill-current text-[var(--app-foreground-muted)]">
            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const price = scaleInfo.minPrice + ratio * (scaleInfo.maxPrice - scaleInfo.minPrice);
              const y = dimensions.height - dimensions.padding.bottom - 
                       ratio * (dimensions.height - dimensions.padding.top - dimensions.padding.bottom);
              return (
                <text
                  key={`y-label-${i}`}
                  x={dimensions.padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs"
                >
                  {formatPrice(price)}
                </text>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Timeframe Selector */}
      {showTimeframeSelector && (
        <div className="flex justify-center space-x-2 mt-4 px-4">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange?.(tf)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                timeframe === tf
                  ? 'bg-[var(--app-accent)] text-[var(--app-background)]'
                  : 'text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)] hover:bg-[var(--app-gray)]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default InteractiveChart;