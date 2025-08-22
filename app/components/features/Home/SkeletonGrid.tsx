/**
 * Skeleton loading grid component
 * 
 * @description Displays skeleton placeholders in a masonry layout
 * while content is being loaded.
 */

"use client";

import React, { memo } from 'react';
import { SKELETON_HEIGHTS } from '@/lib/constants';

interface SkeletonGridProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton grid component for loading states
 * 
 * @param props Component props
 * @returns Skeleton grid element
 */
export const SkeletonGrid = memo(function SkeletonGrid({ className = '' }: SkeletonGridProps) {
  return (
    <div className={`animate-fade-in ${className}`}>
      <div className="columns-2 gap-4 space-y-4">
        {SKELETON_HEIGHTS.map((height, i) => (
          <div key={i} className="mb-4 break-inside-avoid">
            <div className="bg-[var(--app-card-bg)] rounded-2xl overflow-hidden">
              <div 
                className="w-full bg-[var(--app-gray)] animate-pulse rounded-2xl"
                style={{ height: `${height}px` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});