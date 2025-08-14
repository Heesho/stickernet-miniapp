import type { Curate } from "@/lib/constants";

export interface BoardProps {
  tokenId?: string;
  tokenAddress?: string;
  setActiveTab?: (tab: string) => void;
}

export interface BoardData {
  token: {
    id: string;
    name: string;
    uri: string;
    price: string;
    symbol: string;
  };
  curates: Curate[];
  stats: {
    totalVolume: string;
    priceChange24h: number;
    weeklyReward: string;
  };
}