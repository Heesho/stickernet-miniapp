/**
 * Advanced Loading Skeleton Component
 * 
 * Provides sophisticated skeleton loading states with animations,
 * responsive design, and accessibility features.
 */

"use client";

import React, { memo } from 'react';

/**
 * Skeleton variant types
 */
export type SkeletonVariant = 
  | 'text'
  | 'title'
  | 'paragraph'
  | 'circle'
  | 'rectangle'
  | 'rounded'
  | 'card'
  | 'avatar'
  | 'button'
  | 'input'
  | 'image'
  | 'list-item'
  | 'table-row'
  | 'custom';

/**
 * Animation types
 */
export type SkeletonAnimation = 'pulse' | 'wave' | 'shimmer' | 'none';

/**
 * Skeleton size presets
 */
export type SkeletonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Skeleton component props
 */
export interface LoadingSkeletonProps {
  /** Skeleton variant */
  variant?: SkeletonVariant;
  /** Animation type */
  animation?: SkeletonAnimation;
  /** Size preset */
  size?: SkeletonSize;
  /** Custom width */
  width?: string | number;
  /** Custom height */
  height?: string | number;
  /** Number of skeleton items to render */
  count?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether skeleton should be rounded */
  rounded?: boolean;
  /** Accessibility label */
  'aria-label'?: string;
  /** Whether to show shimmer effect */
  shimmer?: boolean;
  /** Custom colors */
  colors?: {
    base?: string;
    highlight?: string;
  };
  /** Responsive behavior */
  responsive?: {
    sm?: Partial<LoadingSkeletonProps>;
    md?: Partial<LoadingSkeletonProps>;
    lg?: Partial<LoadingSkeletonProps>;
  };
}

/**
 * Size mappings for different variants
 */
const SIZE_MAPPINGS: Record<SkeletonVariant, Record<SkeletonSize, { width: string; height: string }>> = {
  text: {
    xs: { width: '4rem', height: '0.75rem' },
    sm: { width: '6rem', height: '0.875rem' },
    md: { width: '8rem', height: '1rem' },
    lg: { width: '12rem', height: '1.125rem' },
    xl: { width: '16rem', height: '1.25rem' },
    '2xl': { width: '20rem', height: '1.5rem' }
  },
  title: {
    xs: { width: '8rem', height: '1.25rem' },
    sm: { width: '12rem', height: '1.5rem' },
    md: { width: '16rem', height: '1.75rem' },
    lg: { width: '20rem', height: '2rem' },
    xl: { width: '24rem', height: '2.25rem' },
    '2xl': { width: '28rem', height: '2.5rem' }
  },
  paragraph: {
    xs: { width: '100%', height: '3rem' },
    sm: { width: '100%', height: '4rem' },
    md: { width: '100%', height: '5rem' },
    lg: { width: '100%', height: '6rem' },
    xl: { width: '100%', height: '8rem' },
    '2xl': { width: '100%', height: '10rem' }
  },
  circle: {
    xs: { width: '1.5rem', height: '1.5rem' },
    sm: { width: '2rem', height: '2rem' },
    md: { width: '3rem', height: '3rem' },
    lg: { width: '4rem', height: '4rem' },
    xl: { width: '5rem', height: '5rem' },
    '2xl': { width: '6rem', height: '6rem' }
  },
  rectangle: {
    xs: { width: '4rem', height: '2rem' },
    sm: { width: '6rem', height: '3rem' },
    md: { width: '8rem', height: '4rem' },
    lg: { width: '12rem', height: '6rem' },
    xl: { width: '16rem', height: '8rem' },
    '2xl': { width: '20rem', height: '10rem' }
  },
  rounded: {
    xs: { width: '4rem', height: '2rem' },
    sm: { width: '6rem', height: '3rem' },
    md: { width: '8rem', height: '4rem' },
    lg: { width: '12rem', height: '6rem' },
    xl: { width: '16rem', height: '8rem' },
    '2xl': { width: '20rem', height: '10rem' }
  },
  card: {
    xs: { width: '12rem', height: '8rem' },
    sm: { width: '16rem', height: '12rem' },
    md: { width: '20rem', height: '16rem' },
    lg: { width: '24rem', height: '20rem' },
    xl: { width: '28rem', height: '24rem' },
    '2xl': { width: '32rem', height: '28rem' }
  },
  avatar: {
    xs: { width: '2rem', height: '2rem' },
    sm: { width: '2.5rem', height: '2.5rem' },
    md: { width: '3rem', height: '3rem' },
    lg: { width: '4rem', height: '4rem' },
    xl: { width: '5rem', height: '5rem' },
    '2xl': { width: '6rem', height: '6rem' }
  },
  button: {
    xs: { width: '4rem', height: '2rem' },
    sm: { width: '5rem', height: '2.25rem' },
    md: { width: '6rem', height: '2.5rem' },
    lg: { width: '8rem', height: '2.75rem' },
    xl: { width: '10rem', height: '3rem' },
    '2xl': { width: '12rem', height: '3.5rem' }
  },
  input: {
    xs: { width: '8rem', height: '2rem' },
    sm: { width: '12rem', height: '2.25rem' },
    md: { width: '16rem', height: '2.5rem' },
    lg: { width: '20rem', height: '2.75rem' },
    xl: { width: '24rem', height: '3rem' },
    '2xl': { width: '28rem', height: '3.5rem' }
  },
  image: {
    xs: { width: '8rem', height: '6rem' },
    sm: { width: '12rem', height: '9rem' },
    md: { width: '16rem', height: '12rem' },
    lg: { width: '20rem', height: '15rem' },
    xl: { width: '24rem', height: '18rem' },
    '2xl': { width: '28rem', height: '21rem' }
  },
  'list-item': {
    xs: { width: '100%', height: '2rem' },
    sm: { width: '100%', height: '2.5rem' },
    md: { width: '100%', height: '3rem' },
    lg: { width: '100%', height: '3.5rem' },
    xl: { width: '100%', height: '4rem' },
    '2xl': { width: '100%', height: '4.5rem' }
  },
  'table-row': {
    xs: { width: '100%', height: '2.5rem' },
    sm: { width: '100%', height: '3rem' },
    md: { width: '100%', height: '3.5rem' },
    lg: { width: '100%', height: '4rem' },
    xl: { width: '100%', height: '4.5rem' },
    '2xl': { width: '100%', height: '5rem' }
  },
  custom: {
    xs: { width: '4rem', height: '2rem' },
    sm: { width: '6rem', height: '3rem' },
    md: { width: '8rem', height: '4rem' },
    lg: { width: '12rem', height: '6rem' },
    xl: { width: '16rem', height: '8rem' },
    '2xl': { width: '20rem', height: '10rem' }
  }
};

/**
 * Get border radius for variant
 */
function getBorderRadius(variant: SkeletonVariant, rounded?: boolean): string {
  if (rounded) return '9999px';
  
  switch (variant) {
    case 'circle':
    case 'avatar':
      return '9999px';
    case 'button':
    case 'input':
      return '0.5rem';
    case 'card':
    case 'image':
      return '0.75rem';
    case 'rounded':
      return '1rem';
    case 'text':
    case 'title':
      return '0.25rem';
    default:
      return '0.375rem';
  }
}

/**
 * Get animation classes
 */
function getAnimationClasses(animation: SkeletonAnimation, shimmer?: boolean): string {
  const baseClasses = [];
  
  switch (animation) {
    case 'pulse':
      baseClasses.push('animate-pulse');
      break;
    case 'wave':
      baseClasses.push('animate-bounce');
      break;
    case 'shimmer':
      baseClasses.push('animate-pulse');
      shimmer = true;
      break;
    case 'none':
      break;
    default:
      baseClasses.push('animate-pulse');
  }
  
  if (shimmer) {
    baseClasses.push('relative overflow-hidden');
  }
  
  return baseClasses.join(' ');
}

/**
 * Single skeleton element component
 */
const SkeletonElement = memo(function SkeletonElement({
  variant = 'rectangle',
  animation = 'pulse',
  size = 'md',
  width,
  height,
  className = '',
  rounded,
  'aria-label': ariaLabel = 'Loading content',
  shimmer = false,
  colors = { base: 'var(--app-gray)', highlight: 'var(--app-gray-light)' }
}: Omit<LoadingSkeletonProps, 'count'>) {
  const sizeConfig = SIZE_MAPPINGS[variant][size];
  const finalWidth = width || sizeConfig.width;
  const finalHeight = height || sizeConfig.height;
  const borderRadius = getBorderRadius(variant, rounded);
  const animationClasses = getAnimationClasses(animation, shimmer);

  const style: React.CSSProperties = {
    width: typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth,
    height: typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight,
    backgroundColor: colors.base,
    borderRadius,
    minHeight: '0.75rem' // Prevent too small heights
  };

  return (
    <div
      className={`${animationClasses} ${className}`}
      style={style}
      role="status"
      aria-label={ariaLabel}
    >
      {shimmer && (
        <div
          className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.highlight || 'rgba(255,255,255,0.2)'}, transparent)`
          }}
        />
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
});

/**
 * Main loading skeleton component
 */
export const LoadingSkeleton = memo(function LoadingSkeleton(props: LoadingSkeletonProps) {
  const { count = 1, ...elementProps } = props;

  if (count === 1) {
    return <SkeletonElement {...elementProps} />;
  }

  return (
    <div className="space-y-2" role="status" aria-label="Loading multiple items">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonElement
          key={index}
          {...elementProps}
          aria-label={`Loading item ${index + 1} of ${count}`}
        />
      ))}
    </div>
  );
});

/**
 * Specialized skeleton components for common use cases
 */

/**
 * Text loading skeleton
 */
export const TextSkeleton = memo(function TextSkeleton({
  lines = 1,
  width = '100%',
  ...props
}: Omit<LoadingSkeletonProps, 'variant' | 'count'> & { lines?: number }) {
  return (
    <LoadingSkeleton
      {...props}
      variant="text"
      count={lines}
      width={width}
    />
  );
});

/**
 * Card loading skeleton
 */
export const CardSkeleton = memo(function CardSkeleton({
  showImage = true,
  showTitle = true,
  showDescription = true,
  ...props
}: Omit<LoadingSkeletonProps, 'variant'> & {
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
}) {
  return (
    <div className="space-y-3 p-4 border border-[var(--app-border)] rounded-lg bg-[var(--app-card-bg)]">
      {showImage && (
        <LoadingSkeleton
          variant="image"
          size="md"
          className="w-full"
          {...props}
        />
      )}
      {showTitle && (
        <LoadingSkeleton
          variant="title"
          size="md"
          width="75%"
          {...props}
        />
      )}
      {showDescription && (
        <div className="space-y-2">
          <LoadingSkeleton
            variant="text"
            size="sm"
            width="100%"
            {...props}
          />
          <LoadingSkeleton
            variant="text"
            size="sm"
            width="80%"
            {...props}
          />
        </div>
      )}
    </div>
  );
});

/**
 * List item loading skeleton
 */
export const ListItemSkeleton = memo(function ListItemSkeleton({
  showAvatar = true,
  showSecondary = true,
  ...props
}: Omit<LoadingSkeletonProps, 'variant'> & {
  showAvatar?: boolean;
  showSecondary?: boolean;
}) {
  return (
    <div className="flex items-center space-x-3 p-3">
      {showAvatar && (
        <LoadingSkeleton
          variant="avatar"
          size="md"
          {...props}
        />
      )}
      <div className="flex-1 space-y-2">
        <LoadingSkeleton
          variant="text"
          size="md"
          width="60%"
          {...props}
        />
        {showSecondary && (
          <LoadingSkeleton
            variant="text"
            size="sm"
            width="40%"
            {...props}
          />
        )}
      </div>
    </div>
  );
});

/**
 * Table row loading skeleton
 */
export const TableRowSkeleton = memo(function TableRowSkeleton({
  columns = 3,
  ...props
}: Omit<LoadingSkeletonProps, 'variant' | 'count'> & { columns?: number }) {
  return (
    <div className="flex items-center space-x-4 p-3 border-b border-[var(--app-border)]">
      {Array.from({ length: columns }, (_, index) => (
        <div key={index} className="flex-1">
          <LoadingSkeleton
            variant="text"
            size="sm"
            width={index === 0 ? '80%' : '60%'}
            {...props}
          />
        </div>
      ))}
    </div>
  );
});

/**
 * Form loading skeleton
 */
export const FormSkeleton = memo(function FormSkeleton({
  fields = 3,
  showButton = true,
  ...props
}: Omit<LoadingSkeletonProps, 'variant' | 'count'> & {
  fields?: number;
  showButton?: boolean;
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          <LoadingSkeleton
            variant="text"
            size="sm"
            width="25%"
            {...props}
          />
          <LoadingSkeleton
            variant="input"
            size="md"
            width="100%"
            {...props}
          />
        </div>
      ))}
      {showButton && (
        <div className="pt-2">
          <LoadingSkeleton
            variant="button"
            size="lg"
            width="30%"
            {...props}
          />
        </div>
      )}
    </div>
  );
});

