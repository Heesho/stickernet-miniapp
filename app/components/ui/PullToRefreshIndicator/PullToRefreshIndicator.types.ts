/**
 * Type definitions for PullToRefreshIndicator component
 */

export interface PullToRefreshIndicatorProps {
  /** Current pull distance */
  pullDistance: number;
  /** Whether refresh is in progress */
  isRefreshing: boolean;
  /** Minimum distance to trigger refresh */
  threshold?: number;
  /** Maximum pull distance for visual feedback */
  maxDistance?: number;
  /** Additional CSS classes */
  className?: string;
}