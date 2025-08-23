/**
 * Enhanced Board Component with Advanced Loading States
 *
 * Extends the existing Board component with the new loading system,
 * better error handling, and progressive loading features.
 */

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

// Enhanced loading components
import {
  useComponentLoading,
  LoadingCard,
  ComponentLoadingOverlay,
  LoadingButton,
} from "@/app/components/ui/Loading";

/**
 * Enhanced board props with loading configuration
 */
export interface BoardEnhancedProps extends BoardProps {
  /** Whether to show global loading indicators */
  showGlobalLoading?: boolean;
  /** Enable progressive loading */
  progressiveLoading?: boolean;
  /** Enable real-time updates */
  realTimeUpdates?: boolean;
  /** Custom loading messages */
  loadingMessages?: {
    initial?: string;
    refreshing?: string;
    error?: string;
  };
}

export function BoardEnhanced({
  tokenId,
  tokenAddress,
  setActiveTab,
  showGlobalLoading = false,
  progressiveLoading = true,
  realTimeUpdates = true,
  loadingMessages = {},
}: BoardEnhancedProps) {
  const router = useRouter();

  // Component-level loading management
  const componentLoading = useComponentLoading("Board");

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

  // Enhanced refresh with loading state
  const handleRefresh = useCallback(async () => {
    const operationId = componentLoading.startLoading({
      type: "refresh",
      message: loadingMessages.refreshing || "Refreshing board data...",
      priority: "medium",
      showGlobally: showGlobalLoading,
    });

    try {
      await refreshBoardData();
      componentLoading.completeOperation(operationId);
    } catch (error) {
      componentLoading.failOperation(operationId, error);
    }
  }, [refreshBoardData, componentLoading, showGlobalLoading, loadingMessages]);

  // Enhanced navigation with loading
  const navigateToCurate = useCallback(
    (curate: Curate) => {
      if (showGlobalLoading) {
        componentLoading.globalLoading.showPageTransition("Loading sticker...");
      }

      router.push(`/b/${tokenId}/${curate.tokenId}`);
    },
    [router, tokenId, showGlobalLoading, componentLoading],
  );

  // Memoized loading states
  const loadingStates = useMemo(
    () => ({
      isInitialLoading: loading && !boardData,
      isRefreshing: componentLoading.isLoading && !!boardData,
      hasError: !!error,
      isEmpty: !loading && !error && !boardData?.curates?.length,
    }),
    [loading, boardData, componentLoading.isLoading, error],
  );

  // Error handling with retry
  const handleRetry = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Early returns for loading and error states
  if (loadingStates.isInitialLoading) {
    return (
      <div className="animate-fade-in">
        <BoardLoadingState />
      </div>
    );
  }

  if (loadingStates.hasError) {
    return (
      <BoardErrorState
        error={error}
        onRetry={handleRetry}
        canRetry={componentLoading.canRetry}
      />
    );
  }

  if (loadingStates.isEmpty) {
    return (
      <LoadingCard
        empty
        emptyMessage="No stickers found for this token"
        className="min-h-96"
        variant="outlined"
        size="lg"
      />
    );
  }

  // Render main board content with loading overlays
  return (
    <div className="relative animate-fade-in">
      {/* Global loading overlay for refresh operations */}
      <ComponentLoadingOverlay
        loading={loadingStates.isRefreshing}
        message={loadingMessages.refreshing || "Refreshing..."}
        spinnerVariant="ring"
      >
        {/* Board Header with loading states */}
        <div className="relative">
          <BoardHeader
            boardData={boardData}
            tokenData={tokenData}
            onRefresh={handleRefresh}
            refreshing={loadingStates.isRefreshing}
            tokenAvatarError={tokenAvatarError}
            setTokenAvatarError={setTokenAvatarError}
            hoveredPrice={hoveredPrice}
            hoveredFloorPrice={hoveredFloorPrice}
            themeColors={themeColors}
          />
        </div>

        {/* Board Statistics with loading states */}
        <LoadingCard
          loading={!boardData?.stats}
          showSkeleton
          skeletonConfig={{
            showImage: false,
            showTitle: true,
            showDescription: true,
            lines: 2,
          }}
          className="mb-4"
        >
          <BoardStatistics stats={boardData?.stats} themeColors={themeColors} />
        </LoadingCard>

        {/* Board Chart with enhanced loading */}
        <LoadingCard
          loading={!timeframePriceData}
          showSkeleton
          skeletonConfig={{
            showImage: true,
            showTitle: false,
            showDescription: false,
          }}
          className="mb-4"
        >
          <BoardChart
            tokenAddress={tokenAddress}
            showTradingView={showTradingView}
            setShowTradingView={setShowTradingView}
            timeframePriceData={timeframePriceData}
            handleTimeframeChange={handleTimeframeChange}
            hoveredPrice={hoveredPrice}
            setHoveredPrice={setHoveredPrice}
            hoveredFloorPrice={hoveredFloorPrice}
            setHoveredFloorPrice={setHoveredFloorPrice}
            progressiveLoading={progressiveLoading}
            realTimeUpdates={realTimeUpdates}
          />
        </LoadingCard>

        {/* Board Tabs with loading states */}
        <BoardTabs
          boardData={boardData}
          onCurateClick={navigateToCurate}
          loading={loadingStates.isRefreshing}
        />

        {/* Board Actions with enhanced buttons */}
        <div className="fixed bottom-4 right-4 z-10">
          <BoardActions
            onCreateSticker={() => setShowCreateSticker(true)}
            onRefresh={handleRefresh}
            refreshing={loadingStates.isRefreshing}
            disabled={componentLoading.isLoading}
          />
        </div>

        {/* Board Modals */}
        <BoardModals
          showCreateSticker={showCreateSticker}
          setShowCreateSticker={setShowCreateSticker}
          selectedCurate={selectedCurate}
          setSelectedCurate={setSelectedCurate}
          boardData={boardData}
          tokenData={tokenData}
          refreshAfterTransaction={refreshAfterTransaction}
          loading={componentLoading.isLoading}
        />
      </ComponentLoadingOverlay>
    </div>
  );
}

/**
 * Enhanced Board Header with loading states
 */
interface EnhancedBoardHeaderProps {
  boardData: any;
  tokenData: any;
  onRefresh: () => void;
  refreshing: boolean;
  tokenAvatarError: boolean;
  setTokenAvatarError: (error: boolean) => void;
  hoveredPrice: string | null;
  hoveredFloorPrice: string | null;
  themeColors: any;
}

function EnhancedBoardHeader({
  boardData,
  tokenData,
  onRefresh,
  refreshing,
  tokenAvatarError,
  setTokenAvatarError,
  hoveredPrice,
  hoveredFloorPrice,
  themeColors,
}: EnhancedBoardHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-[var(--app-border)]">
      {/* Token info with loading skeleton */}
      <LoadingCard
        loading={!boardData?.token}
        showSkeleton
        skeletonConfig={{
          showImage: true,
          showTitle: true,
          showDescription: false,
        }}
        className="flex-1"
        variant="minimal"
      >
        <BoardHeader
          boardData={boardData}
          tokenData={tokenData}
          onRefresh={onRefresh}
          refreshing={refreshing}
          tokenAvatarError={tokenAvatarError}
          setTokenAvatarError={setTokenAvatarError}
          hoveredPrice={hoveredPrice}
          hoveredFloorPrice={hoveredFloorPrice}
          themeColors={themeColors}
        />
      </LoadingCard>

      {/* Refresh button with loading state */}
      <LoadingButton
        loading={refreshing}
        loadingText="Refreshing..."
        onClick={onRefresh}
        variant="outline"
        size="sm"
        startIcon={
          !refreshing && (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )
        }
        aria-label="Refresh board data"
      >
        Refresh
      </LoadingButton>
    </div>
  );
}

/**
 * Enhanced Board Actions with loading states
 */
interface EnhancedBoardActionsProps {
  onCreateSticker: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  disabled: boolean;
}

function EnhancedBoardActions({
  onCreateSticker,
  onRefresh,
  refreshing,
  disabled,
}: EnhancedBoardActionsProps) {
  return (
    <div className="flex flex-col space-y-2">
      {/* Create Sticker Button */}
      <LoadingButton
        onClick={onCreateSticker}
        disabled={disabled}
        variant="primary"
        size="lg"
        className="shadow-lg"
        startIcon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        }
      >
        Create
      </LoadingButton>

      {/* Refresh Button */}
      <LoadingButton
        loading={refreshing}
        loadingText=""
        onClick={onRefresh}
        disabled={disabled}
        variant="secondary"
        size="md"
        className="shadow-lg"
        aria-label="Refresh board"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </LoadingButton>
    </div>
  );
}

// Export both the original and enhanced versions
export { Board } from "./Board";
export default BoardEnhanced;
