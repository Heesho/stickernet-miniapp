/**
 * LoadingIndicators component for Home feed
 * 
 * @description Displays loading states for different feed operations.
 * Memoized for optimal performance.
 */

"use client";

import { memo } from "react";
import { LoadingSpinner } from "../../../ui";

interface LoadingIndicatorsProps {
  /** Whether loading more content */
  loadingMore: boolean;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Whether using mock data */
  useMockData: boolean;
  /** Number of curates currently displayed */
  curateCount: number;
}

export const LoadingIndicators = memo(function LoadingIndicators({
  loadingMore,
  hasMore,
  useMockData,
  curateCount,
}: LoadingIndicatorsProps) {
  return (
    <>
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
      {!hasMore && curateCount > 0 && !useMockData && (
        <div className="text-center py-8 text-[var(--app-foreground-muted)]">
          <p className="text-sm">You've seen all the curations!</p>
        </div>
      )}
    </>
  );
});