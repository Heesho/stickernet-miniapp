/**
 * Pull-to-refresh indicator component
 * 
 * @description Visual feedback component for pull-to-refresh gesture
 * with smooth animations and state transitions.
 */

"use client";

import React from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import type { PullToRefreshIndicatorProps } from './PullToRefreshIndicator.types';

/**
 * Pull-to-refresh indicator component
 * 
 * @param props Indicator configuration props
 * @returns Pull-to-refresh indicator element
 */
export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 60,
  maxDistance = 80,
  className = ''
}: PullToRefreshIndicatorProps) {
  if (pullDistance <= 0) return null;

  const height = Math.min(pullDistance, maxDistance);
  const translateY = -(maxDistance - height);
  const canRelease = pullDistance > threshold;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 flex justify-center items-center bg-[var(--app-background)] z-40 transition-all duration-200 ${className}`}
      style={{ 
        height: `${height}px`,
        transform: `translateY(${translateY}px)` 
      }}
    >
      <div className={`transition-all duration-200 ${isRefreshing ? 'animate-spin' : ''}`}>
        {isRefreshing ? (
          <LoadingSpinner 
            size="md" 
            variant="primary"
            aria-label="Refreshing content..."
          />
        ) : canRelease ? (
          <div className="text-[var(--app-accent)] text-sm font-medium">
            Release to refresh
          </div>
        ) : (
          <div className="text-[var(--app-foreground-muted)] text-sm">
            Pull down to refresh
          </div>
        )}
      </div>
    </div>
  );
}