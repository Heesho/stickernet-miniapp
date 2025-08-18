export interface PriceDataPoint {
  timestamp: number;
  marketPrice: number;
  floorPrice: number;
  volume: number;
}

export type Timeframe = 'LIVE' | '4H' | '1D' | '1W' | '1M' | 'MAX';

export interface InteractiveChartProps {
  priceData: PriceDataPoint[];
  timeframe: Timeframe;
  currentPrice: number;
  onPriceHover?: (dataPoint: PriceDataPoint | null) => void;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  className?: string;
  height?: number;
  showTimeframeSelector?: boolean;
  showFloorPrice?: boolean;
  enableRealTime?: boolean;
}

export interface ChartDimensions {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ScaleInfo {
  xScale: (timestamp: number) => number;
  yScale: (price: number) => number;
  minPrice: number;
  maxPrice: number;
  minTimestamp: number;
  maxTimestamp: number;
}

export interface HoverInfo {
  dataPoint: PriceDataPoint;
  x: number;
  y: number;
  index: number;
}