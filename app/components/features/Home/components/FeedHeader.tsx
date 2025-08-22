/**
 * FeedHeader component for Home feed
 * 
 * @description Displays feed header with demo mode indicator and any announcements.
 * Memoized for optimal performance.
 */

"use client";

import { memo } from "react";

interface FeedHeaderProps {
  /** Whether using mock data */
  useMockData: boolean;
}

export const FeedHeader = memo(function FeedHeader({ useMockData }: FeedHeaderProps) {
  if (!useMockData) {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
      <p className="text-sm text-yellow-600 dark:text-yellow-400">
        Using demo images - API temporarily unavailable
      </p>
    </div>
  );
});