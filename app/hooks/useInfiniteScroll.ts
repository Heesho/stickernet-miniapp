/**
 * Custom hook for managing infinite scroll functionality
 * 
 * @description Handles infinite scroll logic with threshold detection
 * and loading state management for paginated content loading.
 */

"use client";

import { useEffect, useCallback } from 'react';

interface UseInfiniteScrollProps {
  /** Function to call when threshold is reached */
  onLoadMore: () => void;
  /** Whether more items are available to load */
  hasMore: boolean;
  /** Whether currently loading more items */
  isLoading: boolean;
  /** Distance from bottom to trigger loading (default: 300px) */
  threshold?: number;
}

/**
 * Hook for infinite scroll functionality
 * 
 * @param props Configuration for infinite scroll behavior
 * @returns Void - attaches scroll listeners automatically
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 300
}: UseInfiniteScrollProps): void {
  const handleScroll = useCallback(() => {
    if (!hasMore || isLoading) return;

    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollTop + windowHeight >= documentHeight - threshold) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoading, threshold]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
}