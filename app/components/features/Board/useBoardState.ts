import { useState, useCallback, useEffect } from "react";
import type { Curate, Timeframe, BoardData } from "@/types";

export interface TimeframePriceData {
  priceChange: number;
  priceChangeAmount: string;
  label: string;
}

export interface UseBoardStateReturn {
  selectedCurate: Curate | null;
  setSelectedCurate: (curate: Curate | null) => void;
  showCreateSticker: boolean;
  setShowCreateSticker: (show: boolean) => void;
  tokenAvatarError: boolean;
  setTokenAvatarError: (error: boolean) => void;
  scrollY: number;
  showTradingView: boolean;
  setShowTradingView: (show: boolean) => void;
  hoveredPrice: string | null;
  setHoveredPrice: (price: string | null) => void;
  hoveredFloorPrice: string | null;
  setHoveredFloorPrice: (price: string | null) => void;
  selectedTimeframe: "LIVE" | "4H" | "1D" | "1W" | "1M" | "MAX";
  setSelectedTimeframe: (
    timeframe: "LIVE" | "4H" | "1D" | "1W" | "1M" | "MAX",
  ) => void;
  timeframePriceData: TimeframePriceData;
  setTimeframePriceData: (data: TimeframePriceData) => void;
  handleTimeframeChange: (
    timeframe: Timeframe,
    priceData: {
      priceChange: number;
      priceChangeAmount: string;
      label: string;
    },
  ) => void;
  themeColors: {
    color: string;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    isPricePositive: boolean;
    isDataLoaded: boolean;
  };
}

export function useBoardState(
  boardData: BoardData | null,
): UseBoardStateReturn {
  const [selectedCurate, setSelectedCurate] = useState<Curate | null>(null);
  const [showCreateSticker, setShowCreateSticker] = useState(false);
  const [tokenAvatarError, setTokenAvatarError] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showTradingView, setShowTradingView] = useState(false);
  const [hoveredPrice, setHoveredPrice] = useState<string | null>(null);
  const [hoveredFloorPrice, setHoveredFloorPrice] = useState<string | null>(
    null,
  );
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("MAX");
  const [timeframePriceData, setTimeframePriceData] =
    useState<TimeframePriceData>({
      priceChange: 0,  // For MAX view, this will be updated when chart data loads
      priceChangeAmount: "0.000000",
      label: "all time",
    });

  // Handle scroll for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Don't initialize with LIVE data - let it default to positive (blue) theme
  // This ensures the Board view starts with blue theme matching MAX timeframe
  // The theme will only change when user actually interacts with timeframes in Trading View

  // Create the callback for timeframe changes
  const handleTimeframeChange = useCallback(
    (
      timeframe: Timeframe,
      priceData: {
        priceChange: number;
        priceChangeAmount: string;
        label: string;
      },
    ) => {
      setSelectedTimeframe(timeframe);
      if (priceData) {
        setTimeframePriceData(priceData);
      }
    },
    [],
  );

  // Dynamic color theme based on price performance
  const getThemeColors = () => {
    let isPricePositive = true; // Default to positive (blue)
    let isDataLoaded = false;

    // Use timeframePriceData for the currently selected timeframe
    if (
      timeframePriceData.priceChange !== undefined &&
      timeframePriceData.priceChangeAmount !== "0"
    ) {
      isPricePositive = timeframePriceData.priceChange >= 0;
      isDataLoaded = true;
    } else {
      // Default to blue theme (positive) when no timeframe data is available
      // This matches the MAX timeframe default behavior
      isPricePositive = true;
      isDataLoaded = true; // Treat as loaded to show blue instead of gray
    }

    // Always use blue for initial load and only change based on actual timeframe data
    const color = isPricePositive ? "#0052FF" : "#ceb1ff";
    const colorClass = isPricePositive ? "text-[#0052FF]" : "text-[#ceb1ff]";
    const bgClass = isPricePositive ? "bg-[#0052FF]" : "bg-[#ceb1ff]";
    const borderClass = isPricePositive
      ? "border-[#0052FF]"
      : "border-[#ceb1ff]";

    return {
      color,
      colorClass,
      bgClass,
      borderClass,
      isPricePositive,
      isDataLoaded,
    };
  };

  const themeColors = getThemeColors();

  return {
    selectedCurate,
    setSelectedCurate,
    showCreateSticker,
    setShowCreateSticker,
    tokenAvatarError,
    setTokenAvatarError,
    scrollY,
    showTradingView,
    setShowTradingView,
    hoveredPrice,
    setHoveredPrice,
    hoveredFloorPrice,
    setHoveredFloorPrice,
    selectedTimeframe,
    setSelectedTimeframe,
    timeframePriceData,
    setTimeframePriceData,
    handleTimeframeChange,
    themeColors,
  };
}
