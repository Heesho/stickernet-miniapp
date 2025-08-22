/**
 * Custom hook for virtual scrolling optimization
 * 
 * @description Implements virtual scrolling for large lists to improve performance
 * by only rendering visible items and a buffer around them.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { SKELETON_HEIGHTS } from "@/lib/constants";

interface UseVirtualScrollingProps {
  /** Total number of items */
  itemCount: number;
  /** Container height in pixels */
  containerHeight?: number;
  /** Buffer size (number of items to render outside viewport) */
  bufferSize?: number;
  /** Enable virtual scrolling */
  enabled?: boolean;
}

interface UseVirtualScrollingReturn {
  /** Start index of visible range */
  startIndex: number;
  /** End index of visible range */
  endIndex: number;
  /** Total height of all items */
  totalHeight: number;
  /** Offset from top for visible items */
  offsetY: number;
  /** Items to render (indices) */
  visibleItems: number[];
  /** Whether virtual scrolling is active */
  isVirtual: boolean;
}

export function useVirtualScrolling({
  itemCount,
  containerHeight = 800,
  bufferSize = 5,
  enabled = true,
}: UseVirtualScrollingProps): UseVirtualScrollingReturn {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate item heights using skeleton heights pattern
  const itemHeights = useMemo(() => {
    return Array.from({ length: itemCount }, (_, index) => 
      SKELETON_HEIGHTS[index % SKELETON_HEIGHTS.length] + 16 // Add margin
    );
  }, [itemCount]);

  // Calculate item positions
  const itemPositions = useMemo(() => {
    const positions: number[] = [];
    let currentPosition = 0;
    
    for (let i = 0; i < itemCount; i++) {
      positions[i] = currentPosition;
      currentPosition += itemHeights[i];
    }
    
    return positions;
  }, [itemHeights, itemCount]);

  const totalHeight = useMemo(() => {
    return itemPositions.length > 0 
      ? itemPositions[itemPositions.length - 1] + itemHeights[itemHeights.length - 1]
      : 0;
  }, [itemPositions, itemHeights]);

  // Find visible range based on scroll position
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    if (!enabled || itemCount === 0) {
      return {
        startIndex: 0,
        endIndex: itemCount - 1,
        offsetY: 0,
      };
    }

    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + containerHeight;

    // Binary search for start index
    let start = 0;
    let end = itemCount - 1;
    let startIdx = 0;

    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const itemTop = itemPositions[mid];
      const itemBottom = itemTop + itemHeights[mid];

      if (itemBottom >= viewportTop) {
        startIdx = mid;
        end = mid - 1;
      } else {
        start = mid + 1;
      }
    }

    // Binary search for end index
    start = startIdx;
    end = itemCount - 1;
    let endIdx = itemCount - 1;

    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const itemTop = itemPositions[mid];

      if (itemTop <= viewportBottom) {
        endIdx = mid;
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }

    // Apply buffer
    const bufferedStart = Math.max(0, startIdx - bufferSize);
    const bufferedEnd = Math.min(itemCount - 1, endIdx + bufferSize);

    return {
      startIndex: bufferedStart,
      endIndex: bufferedEnd,
      offsetY: itemPositions[bufferedStart] || 0,
    };
  }, [enabled, itemCount, scrollTop, containerHeight, bufferSize, itemPositions, itemHeights]);

  const visibleItems = useMemo(() => {
    return Array.from(
      { length: endIndex - startIndex + 1 },
      (_, index) => startIndex + index
    );
  }, [startIndex, endIndex]);

  // Handle scroll events
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as Element;
    if (target) {
      setScrollTop(target.scrollTop || window.scrollY);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleWindowScroll = () => setScrollTop(window.scrollY);
    
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, [enabled]);

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    visibleItems,
    isVirtual: enabled && itemCount > 20, // Only use virtual scrolling for large lists
  };
}