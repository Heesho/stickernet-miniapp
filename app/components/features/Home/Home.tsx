"use client";

import { useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { PullToRefreshIndicator } from "../../ui";
import { useEnforceBaseWallet } from "../../../hooks/useBaseAccount";
import { ImageDetail } from "./ImageDetail";
import { SkeletonGrid } from "./SkeletonGrid";
import { 
  useCurateData,
  useInfiniteScroll,
  useIntersectionObserver,
  usePullToRefresh,
  useVisibilityPolling
} from "@/app/hooks";
import { INFINITE_SCROLL_THRESHOLD } from "@/lib/constants";
import type { HomeProps } from "./Home.types";

// Import optimized hooks and components
import {
  useHomeState,
  useHomeNavigation,
  useHomeInteractions,
  useOptimizedCallbacks,
} from "./hooks";
import {
  FeedHeader,
  VirtualizedGrid,
  LoadingIndicators,
  FeedErrorStates,
} from "./components";

/**
 * Home component for displaying curated content feed
 * 
 * @description Main feed component with infinite scroll, pull-to-refresh,
 * real-time updates, and responsive design for mobile experience.
 * 
 * @param props Component props including navigation handler
 * @returns Home feed component
 */
export function Home({ setActiveTab, onNavigateToBoard }: HomeProps) {
  const { isConnected } = useAccount();
  const { isValidConnection } = useEnforceBaseWallet();

  // Data management hook
  const {
    curates,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    useMockData,
    newItems,
    loadCurates,
    loadMoreCurates,
    checkForNewCurates
  } = useCurateData();

  // Custom hooks for separated concerns
  const { selectedCurate, showCurate, closeCurate } = useHomeState();
  const { navigateToSticker, navigateToBoard } = useHomeNavigation();
  const { handleCurateSuccess, handleRefresh } = useHomeInteractions();

  // Intersection observer for detecting when user is near top
  const { isIntersecting: isNearTop, observeTemporaryElement } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px 0px 0px 0px'
  });

  // Pull to refresh functionality
  const { pullDistance } = usePullToRefresh({
    onRefresh: handleRefresh,
    isRefreshing: refreshing
  });

  // Infinite scroll functionality
  useInfiniteScroll({
    onLoadMore: loadMoreCurates,
    hasMore,
    isLoading: loadingMore,
    threshold: INFINITE_SCROLL_THRESHOLD
  });

  // Memoize shouldPoll callback to prevent unnecessary re-renders
  const shouldPoll = useCallback(() => isNearTop, [isNearTop]);

  // Polling for new content when visible and near top
  useVisibilityPolling({
    onPoll: checkForNewCurates,
    interval: 15000, // 15 seconds
    enabled: !useMockData,
    shouldPoll
  });

  // Optimized callbacks hook
  const {
    handleImageClick,
    handleModalClose,
    handleCurateSuccess: optimizedCurateSuccess,
    handleBoardNavigation,
  } = useOptimizedCallbacks({
    onShowCurate: showCurate,
    onCloseCurate: closeCurate,
    onNavigateToSticker: navigateToSticker,
    onNavigateToBoard: navigateToBoard,
    onCurateSuccess: handleCurateSuccess,
  });

  // Initialize data on component mount
  useEffect(() => {
    loadCurates(true);
  }, [loadCurates]);

  // Set up intersection observer for top detection
  useEffect(() => {
    const cleanup = observeTemporaryElement(document.body, {
      height: '1px',
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      pointerEvents: 'none'
    });

    return cleanup;
  }, [observeTemporaryElement]);

  // Render loading state
  if (loading) {
    return <SkeletonGrid />;
  }

  // Render error or empty states
  const errorStateComponent = (
    <FeedErrorStates
      error={error}
      curates={curates}
      loading={loading}
    />
  );

  if (error || curates.length === 0) {
    return errorStateComponent;
  }

  return (
    <div className="relative">
      {/* Pull to refresh indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={refreshing}
        threshold={60}
        maxDistance={80}
      />

      <div className="animate-fade-in">
        {/* Feed header with demo indicator */}
        <FeedHeader useMockData={useMockData} />
        
        {/* Virtualized grid for optimal performance */}
        <VirtualizedGrid
          curates={curates}
          newItems={newItems}
          onImageClick={handleImageClick}
          enableVirtualScrolling={curates.length > 20}
        />
        
        {/* Loading indicators */}
        <LoadingIndicators
          loadingMore={loadingMore}
          hasMore={hasMore}
          useMockData={useMockData}
          curateCount={curates.length}
        />
      </div>

      {/* Image Detail Modal */}
      {selectedCurate && (
        <ImageDetail
          curate={selectedCurate}
          onClose={handleModalClose}
          onCurate={optimizedCurateSuccess}
          onNavigateToBoard={handleBoardNavigation}
        />
      )}
    </div>
  );
}