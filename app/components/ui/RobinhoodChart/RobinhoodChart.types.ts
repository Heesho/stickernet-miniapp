export interface PriceDataPoint {
  timestamp: number;
  marketPrice: number;
  floorPrice: number;
  volume: number;
}

export type { Timeframe } from '@/types';

export interface RobinhoodChartProps {
  priceData: PriceDataPoint[];
  timeframe: Timeframe;
  currentPrice: number;
  onPriceHover?: (dataPoint: PriceDataPoint | null) => void;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  height?: number;
  priceChange24h?: number;
}

export interface HoverInfo {
  dataPoint: PriceDataPoint;
  x: number;
  y: number;
  index: number;
}