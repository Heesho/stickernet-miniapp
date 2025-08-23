/**
 * Enhanced Home Component with Advanced Loading States
 *
 * Extends the existing Home component with the new loading system,
 * better performance, and enhanced user experience patterns.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEnforceBaseWallet } from "../../../hooks/useBaseAccount";
import { CurateImage } from "./CurateImage";
import { ImageDetail } from "./ImageDetail";
import { SkeletonGrid } from "./SkeletonGrid";
import {
  useCurateData,
  useInfiniteScroll,
  useIntersectionObserver,
  usePullToRefresh,
  useVisibilityPolling,
} from "@/app/hooks";
import {
  SKELETON_HEIGHTS,
  INFINITE_SCROLL_THRESHOLD,
  type Curate,
} from "@/lib/constants";
import type { HomeProps } from "./Home.types";

// Enhanced loading components
import {
  useComponentLoading,
  DataList,
  LoadingCard,
  LoadingButton,
  LoadingPage,
  ComponentLoadingOverlay,
  useGlobalLoading,
} from "@/app/components/ui/Loading";

/**
 * Enhanced home props with loading configuration
 */
export interface HomeEnhancedProps extends HomeProps {
  /** Whether to show global loading indicators */
  showGlobalLoading?: boolean;
  /** Enable progressive loading */
  progressiveLoading?: boolean;
  /** Enable virtual scrolling for better performance */
  virtualScrolling?: boolean;
  /** Custom loading messages */
  loadingMessages?: {
    initial?: string;
    loadingMore?: string;
    refreshing?: string;
    error?: string;
  };
  /** Page size for pagination */
  pageSize?: number;
  /** Enable prefetching of images */
  prefetchImages?: boolean;
}

/**
 * Enhanced Home component with advanced loading states
 */
export function HomeEnhanced({
  setActiveTab,
  onNavigateToBoard,
  showGlobalLoading = false,
  progressiveLoading = true,
  virtualScrolling = false,
  loadingMessages = {},
  pageSize = 20,
  prefetchImages = true,
}: HomeEnhancedProps) {
  const [selectedCurate, setSelectedCurate] = useState<Curate | null>(null);
  const { isConnected } = useAccount();
  const { isValidConnection } = useEnforceBaseWallet();
  const router = useRouter();

  // Component-level loading management
  const componentLoading = useComponentLoading("Home");
  const globalLoading = useGlobalLoading();

  // Custom hooks for state management
  const {
    curates,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    loadCurates,
    loadMoreCurates,
    checkForNewCurates,
    reset,
  } = useCurateData();

  // Enhanced infinite scroll with loading states
  const { isIntersecting: nearBottom } = useIntersectionObserver({
    threshold: INFINITE_SCROLL_THRESHOLD,
    enabled: hasMore && !loadingMore,
  });

  // Enhanced pull to refresh with loading feedback
  const {
    isPulling,
    pullDistance,
    handlePullStart,
    handlePullMove,
    handlePullEnd,
  } = usePullToRefresh({
    onRefresh: async () => {
      const operationId = componentLoading.startLoading({
        type: "refresh",
        message: loadingMessages.refreshing || "Refreshing feed...",
        priority: "medium",
        showGlobally: showGlobalLoading,
      });

      try {
        await loadCurates(false, true);
        componentLoading.completeOperation(operationId);
      } catch (error) {
        componentLoading.failOperation(operationId, error);
      }
    },
    enabled: !loading && !loadingMore,
  });

  // Auto-refresh with visibility polling
  useVisibilityPolling({
    callback: checkForNewCurates,
    interval: 30000, // 30 seconds
    enabled: isConnected && isValidConnection && !loading,
  });

  // Enhanced load more with loading states
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    const operationId = componentLoading.startLoading({
      type: "pagination",
      message: loadingMessages.loadingMore || "Loading more...",
      priority: "low",
      showGlobally: false,
    });

    try {
      await loadMoreCurates();
      componentLoading.completeOperation(operationId);
    } catch (error) {
      componentLoading.failOperation(operationId, error);
    }
  }, [
    loadingMore,
    hasMore,
    loadMoreCurates,
    componentLoading,
    loadingMessages,
  ]);

  // Auto-trigger load more when near bottom
  useEffect(() => {
    if (nearBottom && hasMore && !loadingMore && !loading) {
      handleLoadMore();
    }
  }, [nearBottom, hasMore, loadingMore, loading, handleLoadMore]);

  // Enhanced navigation with loading states
  const handleCurateClick = useCallback(
    (curate: Curate) => {
      if (showGlobalLoading) {
        globalLoading.showPageTransition("Loading sticker details...");
      }

      setSelectedCurate(curate);
    },
    [showGlobalLoading, globalLoading],
  );

  const handleNavigateToBoard = useCallback(
    (tokenAddress: string) => {
      if (showGlobalLoading) {
        globalLoading.showPageTransition("Loading board...");
      }

      onNavigateToBoard?.(tokenAddress);
    },
    [onNavigateToBoard, showGlobalLoading, globalLoading],
  );

  // Memoized loading states
  const loadingStates = useMemo(
    () => ({
      isInitialLoading: loading && curates.length === 0,
      isRefreshing:
        refreshing || (componentLoading.isLoading && curates.length > 0),
      isLoadingMore:
        loadingMore ||
        componentLoading.activeOperations.some(
          (op) => op.type === "pagination",
        ),
      hasError: !!error,
      isEmpty: !loading && !error && curates.length === 0,
      showSkeleton: loading && curates.length === 0,
    }),
    [loading, refreshing, loadingMore, error, curates.length, componentLoading],
  );

  // Error handling with retry
  const handleRetry = useCallback(async () => {
    // Clear local component loading errors
    componentLoading.clearError();

    const operationId = componentLoading.startLoading({
      type: "retry",
      message: "Retrying...",
      priority: "high",
      showGlobally: showGlobalLoading,
    });

    try {
      reset();
      await loadCurates(true, false);
      componentLoading.completeOperation(operationId);
    } catch (error) {
      componentLoading.failOperation(operationId, error);
    }
  }, [componentLoading, reset, loadCurates, showGlobalLoading]);

  // Connection state handling
  if (!isConnected || !isValidConnection) {
    return (
      <LoadingPage
        layout="centered"
        message="Please connect your wallet to continue"
        showBranding
        animation="fade"
      />
    );
  }

  // Initial loading state
  if (loadingStates.isInitialLoading) {
    return (
      <LoadingPage
        layout="skeleton"
        message={loadingMessages.initial || "Loading your feed..."}
        skeletonConfig={{
          type: "grid",
          count: 12,
        }}
        animation="fade"
      />
    );
  }

  // Error state
  if (loadingStates.hasError && curates.length === 0) {
    return (
      <LoadingCard
        error
        errorMessage={loadingMessages.error || "Failed to load feed"}
        onRetry={handleRetry}
        showRetryButton={componentLoading.canRetry}
        className="min-h-96 m-4"
        variant="outlined"
        size="lg"
      />
    );
  }

  // Empty state
  if (loadingStates.isEmpty) {
    return (
      <LoadingCard
        empty
        emptyMessage="No content available yet. Be the first to create a sticker!"
        className="min-h-96 m-4"
        variant="outlined"
        size="lg"
        emptyIcon={
          <svg
            className="w-16 h-16 text-[var(--app-foreground-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        }
      />
    );
  }

  // Main content with enhanced data list
  return (
    <div
      className="relative"
      onTouchStart={handlePullStart}
      onTouchMove={handlePullMove}
      onTouchEnd={handlePullEnd}
    >
      {/* Pull to refresh indicator */}
      {isPulling && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-[var(--app-bg)] border-b border-[var(--app-border)] transition-transform duration-200"
          style={{
            transform: `translateY(${Math.min(pullDistance, 60)}px)`,
            height: "60px",
          }}
        >
          <div className="flex items-center space-x-2">
            {pullDistance > 50 ? (
              <>
                <svg
                  className="w-5 h-5 text-[var(--app-accent)] animate-spin"
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
                <span className="text-sm text-[var(--app-accent)]">
                  Release to refresh
                </span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 text-[var(--app-foreground-muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                <span className="text-sm text-[var(--app-foreground-muted)]">
                  Pull to refresh
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content with loading overlay */}
      <ComponentLoadingOverlay
        loading={loadingStates.isRefreshing}
        message={loadingMessages.refreshing || "Refreshing..."}
        spinnerVariant="dots"
      >
        {/* Enhanced data list with virtual scrolling support */}
        <DataList
          data={curates}
          renderItem={(curate, index) => (
            <CurateImage
              key={`${curate.id}-${index}`}
              curate={curate}
              onClick={() => handleCurateClick(curate)}
              onNavigateToBoard={handleNavigateToBoard}
              style={{
                height: virtualScrolling
                  ? SKELETON_HEIGHTS[index % SKELETON_HEIGHTS.length]
                  : "auto",
              }}
              loading={false} // Individual items handle their own loading
              prefetchImages={prefetchImages}
            />
          )}
          loading={loadingStates.showSkeleton}
          loadingMore={loadingStates.isLoadingMore}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          variant="cards"
          spacing="md"
          className="columns-2 gap-4 p-4"
          keyExtractor={(curate) => curate.id}
          virtual={virtualScrolling}
          itemHeight={virtualScrolling ? 250 : undefined}
          containerHeight={virtualScrolling ? 600 : undefined}
          skeletonItems={12}
          loadingMoreMessage={
            loadingMessages.loadingMore || "Loading more content..."
          }
          threshold={100}
        />

        {/* Load more button (fallback for manual loading) */}
        {hasMore && !nearBottom && (
          <div className="flex justify-center p-4">
            <LoadingButton
              loading={loadingStates.isLoadingMore}
              loadingText={loadingMessages.loadingMore || "Loading more..."}
              onClick={handleLoadMore}
              variant="outline"
              size="md"
              disabled={loadingStates.isLoadingMore}
            >
              Load More
            </LoadingButton>
          </div>
        )}

        {/* End of content indicator */}
        {!hasMore && curates.length > 0 && (
          <div className="flex justify-center p-8">
            <span className="text-sm text-[var(--app-foreground-muted)]">
              You've reached the end!
            </span>
          </div>
        )}
      </ComponentLoadingOverlay>

      {/* Image detail modal */}
      {selectedCurate && (
        <ImageDetail
          curate={selectedCurate}
          onClose={() => setSelectedCurate(null)}
          onNavigateToBoard={handleNavigateToBoard}
          loading={componentLoading.isLoading}
        />
      )}
    </div>
  );
}

/**
 * Enhanced Curate Image component with loading states
 */
interface EnhancedCurateImageProps {
  curate: Curate;
  onClick: () => void;
  onNavigateToBoard: (tokenAddress: string) => void;
  style?: React.CSSProperties;
  loading?: boolean;
  prefetchImages?: boolean;
}

function EnhancedCurateImage({
  curate,
  onClick,
  onNavigateToBoard,
  style,
  loading = false,
  prefetchImages = true,
}: EnhancedCurateImageProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <LoadingCard
      loading={loading}
      showSkeleton
      skeletonConfig={{
        showImage: true,
        showTitle: true,
        showDescription: false,
      }}
      onClick={onClick}
      interactive
      className="mb-4 break-inside-avoid cursor-pointer"
      style={style}
    >
      <CurateImage
        curate={curate}
        onClick={onClick}
        onNavigateToBoard={onNavigateToBoard}
        onImageLoad={() => setImageLoading(false)}
        onImageError={() => {
          setImageLoading(false);
          setImageError(true);
        }}
        loading={imageLoading}
        error={imageError}
        prefetch={prefetchImages}
      />
    </LoadingCard>
  );
}

// Export both the original and enhanced versions
export { Home } from "./Home";
export default HomeEnhanced;
