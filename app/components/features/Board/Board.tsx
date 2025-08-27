"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { BoardProps } from "./Board.types";
import type { Curate } from "@/types";

// Import custom hooks and components
import { useBoardData } from "./useBoardData";
import { useBoardState } from "./useBoardState";
import { BoardHeader } from "./BoardHeader";
import { BoardStatistics } from "./BoardStatistics";
import { BoardChart } from "./BoardChart";
import { BoardTabs } from "./BoardTabs";
import { BoardActions } from "./BoardActions";
import { BoardModals } from "./BoardModals";
import { BoardLoadingState } from "./BoardLoadingState";
import { BoardErrorState } from "./BoardErrorState";

export function Board({ tokenId, tokenAddress, setActiveTab }: BoardProps) {
  const router = useRouter();

  // Custom hooks for data and state management
  const {
    boardData,
    loading,
    error,
    refreshBoardData,
    tokenData,
    refreshAfterTransaction,
  } = useBoardData(tokenAddress);

  const {
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
    timeframePriceData,
    handleTimeframeChange,
    themeColors,
  } = useBoardState(boardData as any);

  // Memoize handler functions to prevent unnecessary re-renders
  const handleBackToHome = useCallback(() => {
    if (setActiveTab) {
      setActiveTab("home");
    } else {
      router.push("/");
    }
  }, [setActiveTab, router]);

  const handleImageClick = useCallback(
    (curate: Curate) => {
      router.push(`/b/${tokenAddress}/${curate.tokenId}`);
    },
    [router, tokenAddress],
  );

  // Memoize modal handlers
  const handleCloseCurate = useCallback(() => {
    setSelectedCurate(null);
  }, []);

  const handleCurate = useCallback(async () => {
    await refreshAfterTransaction();
    setTimeout(() => {
      refreshBoardData();
    }, 3000);
  }, [refreshAfterTransaction, refreshBoardData]);

  const handleCloseCreateSticker = useCallback(() => {
    setShowCreateSticker(false);
  }, []);

  const handleCreateStickerSuccess = useCallback(() => {
    setShowCreateSticker(false);
    // Multiple refresh attempts to ensure subgraph has indexed the new sticker
    setTimeout(() => {
      refreshBoardData();
    }, 3000);
    setTimeout(() => {
      refreshBoardData();
    }, 6000);
    setTimeout(() => {
      refreshBoardData();
    }, 10000);
  }, [refreshBoardData]);

  const handlePriceHover = useCallback(
    (price: string | null, floorPrice: string | null) => {
      setHoveredPrice(price);
      setHoveredFloorPrice(floorPrice);
    },
    [setHoveredPrice, setHoveredFloorPrice],
  );

  if (loading) {
    return <BoardLoadingState />;
  }

  if (error || !boardData) {
    return <BoardErrorState error={error} onBackToHome={handleBackToHome} />;
  }

  return (
    <div className="animate-fade-in min-h-screen pb-40">
      <BoardHeader
        tokenSymbol={boardData.token.symbol}
        onBackToHome={handleBackToHome}
        showTradingView={showTradingView}
        onToggleView={() => setShowTradingView(!showTradingView)}
        scrollY={scrollY}
        themeColors={themeColors}
      />

      {/* Add spacing for the fixed header - adjusted for PWA */}
      <div className="h-14 pwa-header"></div>

      <BoardStatistics
        token={boardData.token}
        hoveredPrice={hoveredPrice}
        hoveredFloorPrice={hoveredFloorPrice}
        timeframePriceData={timeframePriceData}
        tokenAvatarError={tokenAvatarError}
        onTokenAvatarError={() => setTokenAvatarError(true)}
        showTradingView={showTradingView}
        subgraphData={boardData.subgraphData}
      />

      {/* Spacing between statistics and content */}
      <div className="h-8"></div>

      {/* Board content grid or Trading View */}
      {!showTradingView ? (
        <div className="px-4">
          <BoardTabs
            curates={boardData.curates}
            onImageClick={handleImageClick}
          />
        </div>
      ) : (
        <BoardChart
          tokenAddress={tokenAddress || ""}
          tokenSymbol={boardData.token.symbol}
          tokenName={boardData.token.name}
          tokenPrice={boardData.token.price}
          priceChange24h={boardData.stats.priceChange24h}
          priceChangeAmount={boardData.stats.priceChangeAmount}
          priceChange1h={boardData.stats.priceChange1h}
          userPosition={{
            shares:
              parseInt(tokenData?.accountTokenBalance?.toString() || "0") || 0,
            marketValue: (
              (parseInt(tokenData?.accountTokenBalance?.toString() || "0") ||
                0) * parseFloat(boardData.token.price)
            ).toFixed(2),
          }}
          todayVolume={boardData.stats.swapVolume}
          onPriceHover={handlePriceHover}
          tokenData={tokenData}
          subgraphData={boardData.subgraphData}
          onTimeframeChange={handleTimeframeChange}
        />
      )}

      {/* Sticky Create/Trade button and volume - positioned above navbar */}
      {!showTradingView && (
        <BoardActions
          totalVolume={boardData.stats.totalVolume}
          onCreateSticker={() => setShowCreateSticker(true)}
          themeColor={themeColors.color}
        />
      )}

      <BoardModals
        selectedCurate={selectedCurate}
        onCloseCurate={handleCloseCurate}
        onCurate={handleCurate}
        showCreateSticker={showCreateSticker}
        onCloseCreateSticker={handleCloseCreateSticker}
        onCreateStickerSuccess={handleCreateStickerSuccess}
        tokenAddress={tokenAddress || ""}
        tokenSymbol={boardData.token.symbol}
        tokenName={boardData.token.name}
        boardData={boardData as any}
      />
    </div>
  );
}
