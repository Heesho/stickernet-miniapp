"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { 
  LoadingSpinner, 
  ErrorMessage, 
  PullToRefreshIndicator 
} from "../../ui";
import { useEnforceBaseWallet } from "../../../hooks/useBaseAccount";
import { CurateImage } from "./CurateImage";
import { ImageDetail } from "./ImageDetail";
import { SkeletonGrid } from "./SkeletonGrid";
import { 
  useCurateData,
  useInfiniteScroll,
  useIntersectionObserver,
  usePullToRefresh,
  useVisibilityPolling
} from "@/app/hooks";
import { 
  SKELETON_HEIGHTS,
  INFINITE_SCROLL_THRESHOLD,
  type Curate
} from "@/lib/constants";
import type { HomeProps } from "./Home.types";

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
  const [selectedCurate, setSelectedCurate] = useState<Curate | null>(null);
  const { isConnected } = useAccount();
  const { isValidConnection } = useEnforceBaseWallet();
  const router = useRouter();

  // Custom hooks for state management
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

  // Intersection observer for detecting when user is near top
  const { isIntersecting: isNearTop, observeTemporaryElement } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px 0px 0px 0px'
  });

  // Pull to refresh functionality
  const { pullDistance } = usePullToRefresh({
    onRefresh: () => loadCurates(false, true),
    isRefreshing: refreshing
  });

  // Infinite scroll functionality
  useInfiniteScroll({
    onLoadMore: loadMoreCurates,
    hasMore,
    isLoading: loadingMore,
    threshold: INFINITE_SCROLL_THRESHOLD
  });

  // Polling for new content when visible and near top
  useVisibilityPolling({
    onPoll: checkForNewCurates,
    interval: 15000, // 15 seconds
    enabled: !useMockData,
    shouldPoll: () => isNearTop
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

  // Render error state
  if (error) {
    return (
      <ErrorMessage
        title="Unable to load content"
        message={error}
        onRetry={() => window.location.reload()}
        retryLabel="Try Again"
      />
    );
  }

  // Render empty state
  if (curates.length === 0) {
    return (
      <ErrorMessage
        title="No content available yet"
        message="Check back later for new curations"
        icon="message"
        variant="default"
      />
    );
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

        {useMockData && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Using demo images - API temporarily unavailable
            </p>
          </div>
        )}
        
        <div className="columns-2 gap-4">
          {curates.map((curate, index) => (
            <CurateImage 
              key={curate.id} 
              curate={curate} 
              index={index}
              onImageClick={() => {
                // Navigate to sticker page with cleaner URL structure
                router.push(`/${curate.token.id}/${curate.tokenId}`);
              }}
              isNew={newItems.has(curate.id)}
            />
          ))}
        </div>
        
        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <LoadingSpinner
              size="md"
              variant="accent"
              aria-label="Loading more content..."
            />
          </div>
        )}
        
        {/* End of content indicator */}
        {!hasMore && curates.length > 0 && !useMockData && (
          <div className="text-center py-8 text-[var(--app-foreground-muted)]">
            <p className="text-sm">You've seen all the curations!</p>
          </div>
        )}
      </div>

      {/* Image Detail Modal */}
      {selectedCurate && (
        <ImageDetail
          curate={selectedCurate}
          onClose={() => setSelectedCurate(null)}
          onCurate={() => {
            console.log('Curating:', selectedCurate);
            // Trigger immediate check for new curates after successful curation
            setTimeout(() => {
              checkForNewCurates();
            }, 5000); // Wait 5 seconds for blockchain/subgraph to update
          }}
          onNavigateToBoard={(tokenId: string, tokenAddress: string) => {
            router.push(`/${tokenAddress}`);
          }}
        />
      )}
    </div>
  );
}