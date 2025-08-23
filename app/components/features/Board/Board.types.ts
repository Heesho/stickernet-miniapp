import type { Curate } from "@/lib/constants";
import type { TokenData, SubgraphDataPoint, PriceDataPoint } from "@/types";

export interface BoardProps {
  tokenId?: string;
  tokenAddress?: string;
  setActiveTab?: (tab: string) => void;
}

export interface BoardHeaderProps {
  tokenSymbol: string;
  onBackToHome: () => void;
  showTradingView: boolean;
  onToggleView: () => void;
  scrollY: number;
  themeColors: {
    color: string;
    colorClass: string;
    bgClass: string;
    borderClass: string;
  };
}

export interface BoardStatisticsProps {
  token: {
    name: string;
    symbol: string;
    price: string;
    uri: string;
    owner: string;
  };
  hoveredPrice: string | null;
  hoveredFloorPrice: string | null;
  timeframePriceData: {
    priceChange: number;
    priceChangeAmount: string;
    label: string;
  };
  tokenAvatarError: boolean;
  onTokenAvatarError: () => void;
  showTradingView: boolean;
  subgraphData?: {
    floorPrice?: string;
  };
}

export interface BoardChartProps {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenPrice: string;
  priceChange24h: number;
  priceChangeAmount: string;
  priceChange1h?: number;
  userPosition: {
    shares: number;
    marketValue: string;
  };
  todayVolume: string;
  onPriceHover: (price: string | null, floorPrice: string | null) => void;
  tokenData: TokenData | null;
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
    floorPrice?: string;
  };
  onTimeframeChange: (timeframe: string, priceData: PriceDataPoint[]) => void;
}

export interface BoardTabsProps {
  curates: Curate[];
  onImageClick: (curate: Curate) => void;
}

export interface BoardData {
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
    swapVolume: string;
    priceChange24h: number;
    priceChangeAmount: string;
    priceChange1h?: number;
  };
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
    floorPrice?: string;
  };
}
