"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
// import Image from "next/image"; // Commented out - using regular img for Discord images
import { getProxiedImageUrl } from "@/lib/utils/image-proxy";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Icon } from "../../ui";
import { useContentData, useTokenData } from "../../../hooks/useMulticall";
import { useAccount } from "wagmi";
import { CurateConfirmation } from "./CurateConfirmation";
import { isValidTokenId } from "@/types";
import { fetchTokenBoardData } from "@/lib/api/subgraph";
import type { ImageDetailProps } from "./Home.types";
import { formatCurrency } from "@/lib/utils/formatters";

// Dynamic imports for OnchainKit components to prevent SSR issues
const Avatar = dynamic(
  () =>
    import("@coinbase/onchainkit/identity").then((mod) => ({
      default: mod.Avatar,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-6 h-6 bg-gray-600 rounded-full animate-pulse" />
    ),
  },
);

const Name = dynamic(
  () =>
    import("@coinbase/onchainkit/identity").then((mod) => ({
      default: mod.Name,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-20 h-4 bg-gray-600 rounded animate-pulse" />
    ),
  },
);

export function ImageDetail({
  curate,
  onClose,
  onCurate,
  onNavigateToBoard,
  onStealConfirmationChange,
}: ImageDetailProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [tokenAvatarError, setTokenAvatarError] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const { address: account, isConnected } = useAccount();

  // Use tokenId directly from subgraph
  const tokenAddress = curate.token.id as `0x${string}`;
  const rawTokenId = curate.tokenId;

  // Validate and convert tokenId to the branded type
  const tokenId = isValidTokenId(rawTokenId) ? rawTokenId : undefined;

  // Debug logging

  // Get real-time on-chain data for weekly rewards and current price
  const { weeklyReward, nextPrice, isLoading, isError } = useContentData({
    tokenAddress,
    tokenId,
    enabled: !!(tokenAddress && tokenId),
  });

  // Get token data for price change
  const { tokenData } = useTokenData({
    tokenAddress,
    account,
    enabled: !!(tokenAddress && account && isConnected),
  });

  // Fetch price change from subgraph
  useEffect(() => {
    const fetchPriceChange = async () => {
      try {
        const boardData = await fetchTokenBoardData(tokenAddress.toLowerCase());
        if (boardData?.tokenDayData && boardData.tokenDayData.length >= 2) {
          const currentPrice = parseFloat(boardData.marketPrice || "0");
          const yesterdayPrice = parseFloat(
            boardData.tokenDayData[1].marketPrice || "0",
          );
          if (yesterdayPrice > 0) {
            const change =
              ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100;
            setPriceChange24h(change);
          }
        }
      } catch (error) {
        console.error("Error fetching price change:", error);
      }
    };
    fetchPriceChange();
  }, [tokenAddress]);

  // Memoize theme calculations - default to blue (MAX timeframe behavior)
  const themeColors = useMemo(() => {
    // Always default to blue theme to match MAX timeframe default
    // This prevents purple flash for tokens with negative 24h performance
    const priceIsUp = true; // Always blue for consistency with Board view

    return {
      isDataLoaded: true,
      priceIsUp,
      themeColor: "#0052FF",
      themeColorClass: "text-[#0052FF]",
      themeBgClass: "bg-[#0052FF]",
      themeBorderClass: "border-[#0052FF]",
    };
  }, []);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleCurate = useCallback(() => {
    if (!nextPrice || parseFloat(nextPrice) <= 0) {
      console.error("Invalid next price for curation");
      return;
    }

    // Show confirmation page
    setShowConfirmation(true);
    onStealConfirmationChange?.(true);
  }, [nextPrice, onStealConfirmationChange]);

  const handleBoardClick = useCallback(() => {
    router.push(`/b/${curate.token.id}`);
  }, [router, curate.token.id]);

  const handleStickerClick = useCallback(() => {
    router.push(`/b/${curate.token.id}/${curate.tokenId}`);
  }, [router, curate.token.id, curate.tokenId]);

  const handleUserClick = useCallback(
    (userAddress: string) => {
      router.push(`/u/${userAddress}`);
    },
    [router],
  );

  if (isError) {
    console.error("Error fetching content data from multicall");
  }

  // If showing confirmation, render that instead
  if (showConfirmation && nextPrice) {
    return (
      <CurateConfirmation
        curate={curate}
        nextPrice={nextPrice}
        onClose={() => {
          setShowConfirmation(false);
          onStealConfirmationChange?.(false);
        }}
        onSuccess={() => {
          setShowConfirmation(false);
          onStealConfirmationChange?.(false);
          onCurate();
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex justify-center overflow-y-auto">
      <div className="w-full max-w-md bg-black min-h-screen relative">
        {/* Sticky back button */}
        <button
          onClick={onClose}
          className="fixed top-4 w-10 h-10 bg-black bg-opacity-80 rounded-lg flex items-center justify-center hover:bg-opacity-90 transition-all backdrop-blur-sm z-50"
          style={{ left: "max(1rem, calc(50% - 13rem))" }} // Centers it within the max-w-md container with padding
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={themeColors.themeColor}
            strokeWidth="2"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        {/* Image at top - clickable to go to dedicated sticker page */}
        <div className="relative">
          {!imageError ? (
            <div className="relative">
              {!imageLoaded && (
                <div className="h-screen bg-gray-800 animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
                </div>
              )}
              <button
                onClick={handleStickerClick}
                className="w-full relative block"
              >
                <img
                  src={getProxiedImageUrl(curate.uri)}
                  alt={`Curate ${curate.id}`}
                  className={`w-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0 absolute top-0"} max-h-screen`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  style={{ height: "auto", minHeight: "60vh" }}
                />
              </button>
            </div>
          ) : (
            <div className="h-screen bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <Icon
                  name="profile"
                  size="lg"
                  className="text-gray-500 mx-auto mb-2"
                />
                <p className="text-xs text-gray-500">Image not available</p>
              </div>
            </div>
          )}
        </div>

        {/* Content below image */}
        <div className="px-4 pt-4 pb-40 bg-black">
          {/* Interaction stats and price inline directly under image */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-6 text-white">
              <div className="flex items-center space-x-1">
                <Icon name="heart" size="sm" className="text-white" />
                <span className="text-sm">2</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-sm">5</span>
              </div>
            </div>
            {/* Price on the right side - bright and prominent */}
            <div className="text-white text-2xl font-bold">
              {nextPrice && parseFloat(nextPrice) > 0
                ? formatCurrency(nextPrice, 2, false)
                : formatCurrency(curate.price, 2, false)}
            </div>
          </div>

          {/* Clean info section - left aligned, no labels */}
          <div className="space-y-3">
            {/* Coin with avatar and ID - clickable */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleBoardClick}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                {!tokenAvatarError ? (
                  <img
                    src={getProxiedImageUrl(curate.token.uri)}
                    alt={`${curate.token.name} cover`}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={() => setTokenAvatarError(true)}
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                )}
                <span className="text-white text-lg font-semibold">
                  {curate.token.symbol || curate.token.name}
                </span>
              </button>

              {/* ID on the right */}
              <span className="text-white text-sm">
                {curate.tokenId.toString()}
              </span>
            </div>

            {/* Created by */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Created by</span>
              <button
                onClick={() => handleUserClick(curate.creator.id)}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <Avatar
                  address={curate.creator.id as `0x${string}`}
                  className="w-5 h-5"
                />
                <Name
                  address={curate.creator.id as `0x${string}`}
                  className="text-white text-sm"
                />
              </button>
            </div>

            {/* Owned by */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Owned by</span>
              <button
                onClick={() =>
                  handleUserClick(curate.user?.id || curate.creator.id)
                }
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <Avatar
                  address={
                    (curate.user?.id as `0x${string}`) ||
                    (curate.creator.id as `0x${string}`)
                  }
                  className="w-5 h-5"
                />
                <Name
                  address={
                    (curate.user?.id as `0x${string}`) ||
                    (curate.creator.id as `0x${string}`)
                  }
                  className="text-white text-sm"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Earnings and Steal button - matching Board's volume section */}
        <div className="fixed bottom-20 left-0 right-0 z-40">
          <div className="w-full max-w-md mx-auto bg-black px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Owner's Weekly Earnings - matching volume display style */}
              <div>
                <div className="text-white text-sm opacity-70">
                  Owner's Weekly Earnings
                </div>
                <div className="text-white text-2xl font-bold">
                  {weeklyReward && parseFloat(weeklyReward) > 0
                    ? formatCurrency(weeklyReward, 2, false)
                    : formatCurrency(1.81, 2, false)}
                </div>
              </div>

              {/* Steal button - matching Stick/Trade button exactly */}
              <button
                onClick={handleCurate}
                disabled={isLoading || !nextPrice}
                className={`font-semibold py-2.5 px-8 rounded-xl border-2 ${themeColors.themeBorderClass} min-w-[120px] transition-all duration-200 ${
                  isLoading
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : `${themeColors.themeBgClass} hover:opacity-90 text-black`
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  "Steal"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
