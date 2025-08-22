/**
 * FeedErrorStates component for Home feed
 * 
 * @description Handles error and empty states for the feed with proper memoization.
 */

"use client";

import { memo } from "react";
import { ErrorMessage } from "../../../ui";

interface FeedErrorStatesProps {
  /** Error message if any */
  error: string | null;
  /** Array of curates */
  curates: any[];
  /** Loading state */
  loading: boolean;
}

export const FeedErrorStates = memo(function FeedErrorStates({
  error,
  curates,
  loading,
}: FeedErrorStatesProps) {
  // Don't render if loading or no error/empty state
  if (loading || (!error && curates.length > 0)) {
    return null;
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

  return null;
});