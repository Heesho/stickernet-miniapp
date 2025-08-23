/**
 * Loading Card Component
 * 
 * Card component with integrated loading states, skeleton placeholders,
 * and error handling for content cards.
 */

"use client";

import React, { memo } from 'react';
import { LoadingSkeleton, CardSkeleton } from './LoadingSkeleton';
import { EnhancedLoadingSpinner } from './LoadingSpinner.enhanced';

/**
 * Card loading state types
 */
export type CardLoadingState = 'idle' | 'loading' | 'success' | 'error' | 'empty';

/**
 * Loading card props
 */
export interface LoadingCardProps {
  /** Current loading state */
  loading?: boolean;
  /** Error state */
  error?: boolean;
  /** Empty state (no data) */
  empty?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Error message */
  errorMessage?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Whether to show skeleton instead of spinner */
  showSkeleton?: boolean;
  /** Skeleton configuration */
  skeletonConfig?: {
    showImage?: boolean;
    showTitle?: boolean;
    showDescription?: boolean;
    lines?: number;
  };
  /** Retry function for error state */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Card content when not loading */
  children?: React.ReactNode;
  /** Whether card should be interactive */
  interactive?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Card variant */
  variant?: 'default' | 'outlined' | 'elevated' | 'minimal';
  /** Card size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show refresh button in error state */
  showRetryButton?: boolean;
  /** Custom error icon */
  errorIcon?: React.ReactNode;
  /** Custom empty icon */
  emptyIcon?: React.ReactNode;
}

/**
 * Get card variant classes
 */
function getCardVariantClasses(variant: LoadingCardProps['variant']): string {
  switch (variant) {
    case 'outlined':
      return 'border border-[var(--app-border)] bg-transparent';
    case 'elevated':
      return 'bg-[var(--app-card-bg)] shadow-lg border border-[var(--app-border)]/50';
    case 'minimal':
      return 'bg-transparent';
    default:
      return 'bg-[var(--app-card-bg)] border border-[var(--app-border)]';
  }
}

/**
 * Get card size classes
 */
function getCardSizeClasses(size: LoadingCardProps['size']): string {
  switch (size) {
    case 'sm':
      return 'p-3 rounded-md';
    case 'md':
      return 'p-4 rounded-lg';
    case 'lg':
      return 'p-6 rounded-xl';
    default:
      return 'p-4 rounded-lg';
  }
}

/**
 * Loading state component
 */
const LoadingState = memo(function LoadingState({
  message = 'Loading...',
  showSkeleton,
  skeletonConfig = {}
}: {
  message: string;
  showSkeleton?: boolean;
  skeletonConfig?: LoadingCardProps['skeletonConfig'];
}) {
  if (showSkeleton) {
    return <CardSkeleton {...skeletonConfig} />;
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-3">
      <EnhancedLoadingSpinner
        variant="ring"
        size="md"
        showText
        text={message}
        textPosition="bottom"
      />
    </div>
  );
});

/**
 * Error state component
 */
const ErrorState = memo(function ErrorState({
  message = 'Something went wrong',
  onRetry,
  showRetryButton = true,
  errorIcon
}: {
  message: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
  errorIcon?: React.ReactNode;
}) {
  const defaultErrorIcon = (
    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
      {errorIcon || defaultErrorIcon}
      <div>
        <p className="text-[var(--app-foreground)] font-medium">Error</p>
        <p className="text-sm text-[var(--app-foreground-muted)] mt-1">{message}</p>
      </div>
      {showRetryButton && onRetry && (
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
 * Empty state component
 */
const EmptyState = memo(function EmptyState({
  message = 'No data available',
  emptyIcon
}: {
  message: string;
  emptyIcon?: React.ReactNode;
}) {
  const defaultEmptyIcon = (
    <svg className="w-8 h-8 text-[var(--app-foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
      {emptyIcon || defaultEmptyIcon}
      <p className="text-[var(--app-foreground-muted)]">{message}</p>
    </div>
  );
});

/**
 * Main loading card component
 */
export const LoadingCard = memo(function LoadingCard({
  loading = false,
  error = false,
  empty = false,
  loadingMessage = 'Loading...',
  errorMessage = 'Something went wrong',
  emptyMessage = 'No data available',
  showSkeleton = false,
  skeletonConfig,
  onRetry,
  className = '',
  children,
  interactive = false,
  onClick,
  variant = 'default',
  size = 'md',
  showRetryButton = true,
  errorIcon,
  emptyIcon
}: LoadingCardProps) {
  
  // Determine current state
  const currentState: CardLoadingState = loading ? 'loading' :
                                        error ? 'error' :
                                        empty ? 'empty' :
                                        'success';

  // Base classes
  const baseClasses = `
    transition-all duration-200 ease-in-out
    ${interactive ? 'cursor-pointer hover:shadow-md' : ''}
  `;

  // Combine classes
  const cardClasses = `
    ${baseClasses}
    ${getCardVariantClasses(variant)}
    ${getCardSizeClasses(size)}
    ${className}
  `;

  // Handle click
  const handleClick = () => {
    if (interactive && onClick && currentState === 'success') {
      onClick();
    }
  };

  // Render content based on state
  const renderContent = () => {
    switch (currentState) {
      case 'loading':
        return (
          <LoadingState
            message={loadingMessage}
            showSkeleton={showSkeleton}
            skeletonConfig={skeletonConfig}
          />
        );
      case 'error':
        return (
          <ErrorState
            message={errorMessage}
            onRetry={onRetry}
            showRetryButton={showRetryButton}
            errorIcon={errorIcon}
          />
        );
      case 'empty':
        return (
          <EmptyState
            message={emptyMessage}
            emptyIcon={emptyIcon}
          />
        );
      default:
        return children;
    }
  };

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive && currentState === 'success' ? 0 : undefined}
      onKeyDown={interactive ? (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && currentState === 'success') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      {renderContent()}
    </div>
  );
});

/**
 * Image card with loading states
 */
export interface ImageCardProps extends Omit<LoadingCardProps, 'showSkeleton' | 'skeletonConfig'> {
  /** Image source */
  src?: string;
  /** Image alt text */
  alt?: string;
  /** Image title */
  title?: string;
  /** Image description */
  description?: string;
  /** Whether image is loading */
  imageLoading?: boolean;
  /** Image error state */
  imageError?: boolean;
  /** Aspect ratio */
  aspectRatio?: 'square' | '4:3' | '16:9' | 'auto';
}

export const ImageCard = memo(function ImageCard({
  src,
  alt = '',
  title,
  description,
  imageLoading = false,
  imageError = false,
  aspectRatio = 'auto',
  children,
  ...cardProps
}: ImageCardProps) {
  const [imgLoading, setImgLoading] = React.useState(true);
  const [imgError, setImgError] = React.useState(false);

  const isLoading = cardProps.loading || imageLoading || imgLoading;
  const hasError = cardProps.error || imageError || imgError;

  // Aspect ratio classes
  const aspectRatioClasses = {
    'square': 'aspect-square',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-video',
    'auto': ''
  };

  const imageContent = (
    <div className={`relative overflow-hidden rounded-lg ${aspectRatioClasses[aspectRatio]}`}>
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imgLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setImgLoading(false)}
          onError={() => {
            setImgLoading(false);
            setImgError(true);
          }}
        />
      ) : (
        <div className="w-full h-full bg-[var(--app-gray)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--app-foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      
      {/* Loading overlay */}
      {imgLoading && (
        <div className="absolute inset-0 bg-[var(--app-gray)] animate-pulse" />
      )}
    </div>
  );

  const textContent = (title || description) && (
    <div className="mt-3 space-y-1">
      {title && (
        <h3 className="font-medium text-[var(--app-foreground)] line-clamp-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-[var(--app-foreground-muted)] line-clamp-3">
          {description}
        </p>
      )}
    </div>
  );

  return (
    <LoadingCard
      {...cardProps}
      loading={isLoading}
      error={hasError}
      showSkeleton={isLoading}
      skeletonConfig={{
        showImage: true,
        showTitle: !!title,
        showDescription: !!description
      }}
    >
      {imageContent}
      {textContent}
      {children}
    </LoadingCard>
  );
});

