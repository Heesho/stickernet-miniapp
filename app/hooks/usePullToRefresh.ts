/**
 * Custom hook for pull-to-refresh functionality
 * 
 * @description Manages touch gestures and visual feedback for pull-to-refresh
 * behavior on mobile devices.
 */

"use client";

import { useState, useEffect, useCallback } from 'react';

interface UsePullToRefreshProps {
  /** Function to call when refresh is triggered */
  onRefresh: () => void;
  /** Whether refresh is currently in progress */
  isRefreshing: boolean;
  /** Minimum pull distance to trigger refresh (default: 60px) */
  threshold?: number;
  /** Maximum pull distance for visual feedback (default: 100px) */
  maxDistance?: number;
}

interface UsePullToRefreshReturn {
  /** Current pull distance for visual feedback */
  pullDistance: number;
  /** Whether user is currently pulling */
  isPulling: boolean;
}

/**
 * Hook for pull-to-refresh functionality
 * 
 * @param props Configuration for pull-to-refresh behavior
 * @returns Object with pull state for visual feedback
 */
export function usePullToRefresh({
  onRefresh,
  isRefreshing,
  threshold = 60,
  maxDistance = 100
}: UsePullToRefreshProps): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(false);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY;
      
      if (distance > 0) {
        const clampedDistance = Math.min(distance, maxDistance);
        setPullDistance(clampedDistance);
        setIsPulling(true);
        
        if (distance > 20) {
          e.preventDefault();
        }
      }
    }
  }, [startY, isRefreshing, maxDistance]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > threshold && !isRefreshing) {
      onRefresh();
    }
    setPullDistance(0);
    setStartY(0);
    setIsPulling(false);
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const options = { passive: false };
    
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pullDistance,
    isPulling
  };
}