/**
 * Loading List Component
 * 
 * List component with loading states, infinite scroll support,
 * and item-level loading management.
 */

"use client";

import React, { memo } from 'react';
import { ListItemSkeleton } from './LoadingSkeleton';
import { EnhancedLoadingSpinner } from './LoadingSpinner.enhanced';

/**
 * Loading list props
 */
export interface LoadingListProps {
  /** Whether list is loading */
  loading?: boolean;
  /** Error state */
  error?: boolean;
  /** Empty state */
  empty?: boolean;
  /** Number of skeleton items */
  skeletonItems?: number;
  /** Loading message */
  loadingMessage?: string;
  /** Error message */
  errorMessage?: string;
  /** Empty message */
  emptyMessage?: string;
  /** Retry function */
  onRetry?: () => void;
  /** List content */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** List variant */
  variant?: 'default' | 'bordered' | 'divided' | 'cards';
  /** Item spacing */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  /** Whether items should show avatars in skeleton */
  showAvatars?: boolean;
  /** Whether items should show secondary text in skeleton */
  showSecondaryText?: boolean;
  /** Whether to show loading more indicator */
  loadingMore?: boolean;
  /** Loading more message */
  loadingMoreMessage?: string;
  /** Virtual scrolling support */
  virtual?: boolean;
  /** Item height for virtual scrolling */
  itemHeight?: number;
  /** Container height for virtual scrolling */
  containerHeight?: number;
}

/**
 * Get list variant classes
 */
function getListVariantClasses(variant: LoadingListProps['variant']): string {
  switch (variant) {
    case 'bordered':
      return 'border border-[var(--app-border)] rounded-lg overflow-hidden';
    case 'divided':
      return 'divide-y divide-[var(--app-border)]';
    case 'cards':
      return 'space-y-2';
    default:
      return '';
  }
}

/**
 * Get spacing classes
 */
function getSpacingClasses(spacing: LoadingListProps['spacing']): string {
  switch (spacing) {
    case 'none':
      return '';
    case 'sm':
      return 'space-y-1';
    case 'md':
      return 'space-y-2';
    case 'lg':
      return 'space-y-4';
    default:
      return 'space-y-2';
  }
}

/**
 * List loading state component
 */
const ListLoadingState = memo(function ListLoadingState({
  skeletonItems = 5,
  showAvatars = true,
  showSecondaryText = true,
  variant = 'default'
}: {
  skeletonItems: number;
  showAvatars: boolean;
  showSecondaryText: boolean;
  variant: LoadingListProps['variant'];
}) {
  const isCards = variant === 'cards';
  
  return (
    <div className={isCards ? 'space-y-2' : ''}>
      {Array.from({ length: skeletonItems }, (_, index) => (
        <div
          key={index}
          className={isCards ? 'bg-[var(--app-card-bg)] border border-[var(--app-border)] rounded-lg' : ''}
        >
          <ListItemSkeleton
            showAvatar={showAvatars}
            showSecondary={showSecondaryText}
          />
        </div>
      ))}
    </div>
  );
});

/**
 * List error state component
 */
const ListErrorState = memo(function ListErrorState({
  message = 'Failed to load items',
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
      <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="text-[var(--app-foreground)] font-medium">Error Loading Items</p>
        <p className="text-sm text-[var(--app-foreground-muted)] mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium text-[var(--app-accent)] border border-[var(--app-accent)] rounded-md hover:bg-[var(--app-accent)] hover:text-white transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
});

/**
 * List empty state component
 */
const ListEmptyState = memo(function ListEmptyState({
  message = 'No items found'
}: {
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
      <svg className="w-12 h-12 text-[var(--app-foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p className="text-[var(--app-foreground-muted)]">{message}</p>
    </div>
  );
});

/**
 * Loading more indicator component
 */
const LoadingMoreIndicator = memo(function LoadingMoreIndicator({
  message = 'Loading more...'
}: {
  message: string;
}) {
  return (
    <div className="flex items-center justify-center py-4 space-x-3">
      <EnhancedLoadingSpinner
        variant="dots"
        size="sm"
      />
      <span className="text-sm text-[var(--app-foreground-muted)]">
        {message}
      </span>
    </div>
  );
});

/**
 * Main loading list component
 */
export const LoadingList = memo(function LoadingList({
  loading = false,
  error = false,
  empty = false,
  skeletonItems = 5,
  loadingMessage = 'Loading...',
  errorMessage = 'Failed to load items',
  emptyMessage = 'No items found',
  onRetry,
  children,
  className = '',
  variant = 'default',
  spacing = 'md',
  showAvatars = true,
  showSecondaryText = true,
  loadingMore = false,
  loadingMoreMessage = 'Loading more...',
  virtual = false,
  itemHeight = 60,
  containerHeight = 400
}: LoadingListProps) {
  
  // Base list classes
  const listClasses = `
    ${getListVariantClasses(variant)}
    ${!loading && !error && !empty ? getSpacingClasses(spacing) : ''}
    ${className}
  `;

  // Render list content based on state
  const renderListContent = () => {
    if (loading) {
      return (
        <ListLoadingState
          skeletonItems={skeletonItems}
          showAvatars={showAvatars}
          showSecondaryText={showSecondaryText}
          variant={variant}
        />
      );
    }

    if (error) {
      return (
        <ListErrorState
          message={errorMessage}
          onRetry={onRetry}
        />
      );
    }

    if (empty) {
      return (
        <ListEmptyState
          message={emptyMessage}
        />
      );
    }

    // Success state with actual content
    return (
      <>
        {children}
        {loadingMore && (
          <LoadingMoreIndicator message={loadingMoreMessage} />
        )}
      </>
    );
  };

  // Virtual scrolling wrapper
  if (virtual && !loading && !error && !empty) {
    return (
      <div
        className={`overflow-auto ${className}`}
        style={{ height: containerHeight }}
      >
        <div className={listClasses}>
          {renderListContent()}
        </div>
      </div>
    );
  }

  return (
    <div className={listClasses}>
      {renderListContent()}
    </div>
  );
});

/**
 * Data list with enhanced loading states
 */
export interface DataListProps<T = any> extends Omit<LoadingListProps, 'children'> {
  /** List data */
  data?: T[];
  /** Item render function */
  renderItem?: (item: T, index: number) => React.ReactNode;
  /** Whether data is being fetched */
  fetching?: boolean;
  /** Whether more data is available */
  hasMore?: boolean;
  /** Load more function */
  onLoadMore?: () => void;
  /** Infinite scroll threshold */
  threshold?: number;
  /** Key extractor for items */
  keyExtractor?: (item: T, index: number) => string | number;
}

export const DataList = memo(function DataList<T = any>({
  data = [],
  renderItem,
  fetching = false,
  hasMore = false,
  onLoadMore,
  threshold = 100,
  keyExtractor = (_, index) => index,
  ...props
}: DataListProps<T>) {
  
  // Determine states
  const loading = props.loading || (fetching && data.length === 0);
  const empty = !loading && !props.error && data.length === 0;
  const loadingMore = fetching && data.length > 0;

  // Infinite scroll support
  const listRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (!hasMore || loadingMore || !onLoadMore) return;

    const handleScroll = () => {
      const element = listRef.current;
      if (!element) return;

      const { scrollTop, scrollHeight, clientHeight } = element;
      const nearBottom = scrollTop + clientHeight >= scrollHeight - threshold;

      if (nearBottom) {
        onLoadMore();
      }
    };

    const element = listRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loadingMore, onLoadMore, threshold]);

  return (
    <div ref={listRef}>
      <LoadingList
        {...props}
        loading={loading}
        empty={empty}
        loadingMore={loadingMore}
      >
        {data.map((item, index) => (
          <div key={keyExtractor(item, index)}>
            {renderItem?.(item, index)}
          </div>
        ))}
      </LoadingList>
    </div>
  );
});

/**
 * List item component with loading state
 */
export interface LoadingListItemProps {
  /** Whether item is loading */
  loading?: boolean;
  /** Item content */
  children?: React.ReactNode;
  /** Whether to show avatar skeleton */
  showAvatar?: boolean;
  /** Whether to show secondary text skeleton */
  showSecondary?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

export const LoadingListItem = memo(function LoadingListItem({
  loading = false,
  children,
  showAvatar = true,
  showSecondary = true,
  className = '',
  onClick
}: LoadingListItemProps) {
  
  if (loading) {
    return (
      <div className={className}>
        <ListItemSkeleton
          showAvatar={showAvatar}
          showSecondary={showSecondary}
        />
      </div>
    );
  }

  return (
    <div
      className={`
        ${onClick ? 'cursor-pointer hover:bg-[var(--app-gray-light)] transition-colors' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

/**
 * Simple list item component
 */
export interface ListItemProps {
  /** Primary text */
  primary: React.ReactNode;
  /** Secondary text */
  secondary?: React.ReactNode;
  /** Start content (avatar, icon, etc.) */
  startContent?: React.ReactNode;
  /** End content (actions, badge, etc.) */
  endContent?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether item is selected */
  selected?: boolean;
  /** Whether item is disabled */
  disabled?: boolean;
}

export const ListItem = memo(function ListItem({
  primary,
  secondary,
  startContent,
  endContent,
  onClick,
  className = '',
  selected = false,
  disabled = false
}: ListItemProps) {
  return (
    <div
      className={`
        flex items-center p-3 transition-colors
        ${onClick && !disabled ? 'cursor-pointer hover:bg-[var(--app-gray-light)]' : ''}
        ${selected ? 'bg-[var(--app-accent)]/10 border-r-2 border-[var(--app-accent)]' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={!disabled ? onClick : undefined}
    >
      {/* Start content */}
      {startContent && (
        <div className="flex-shrink-0 mr-3">
          {startContent}
        </div>
      )}
      
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--app-foreground)] truncate">
          {primary}
        </div>
        {secondary && (
          <div className="text-sm text-[var(--app-foreground-muted)] truncate">
            {secondary}
          </div>
        )}
      </div>
      
      {/* End content */}
      {endContent && (
        <div className="flex-shrink-0 ml-3">
          {endContent}
        </div>
      )}
    </div>
  );
});

// Export types
export type { DataListProps, LoadingListItemProps, ListItemProps };