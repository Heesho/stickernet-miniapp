/**
 * Loading Page Component
 * 
 * Full-page loading component with various states and layouts
 * for different page loading scenarios.
 */

"use client";

import React, { memo } from 'react';
import { PageLoadingSpinner } from './LoadingSpinner.enhanced';
import { SkeletonGrid } from '../../../components/features/Home/SkeletonGrid';

/**
 * Page loading layout types
 */
export type PageLoadingLayout = 
  | 'centered'
  | 'top'
  | 'skeleton'
  | 'minimal'
  | 'branded'
  | 'progress';

/**
 * Loading page props
 */
export interface LoadingPageProps {
  /** Loading layout variant */
  layout?: PageLoadingLayout;
  /** Loading message */
  message?: string;
  /** Whether to show app branding */
  showBranding?: boolean;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Whether to show progress percentage */
  showProgress?: boolean;
  /** Custom logo/icon */
  logo?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Background color override */
  backgroundColor?: string;
  /** Animation variant */
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  /** Whether page is transparent overlay */
  overlay?: boolean;
  /** Custom skeleton configuration */
  skeletonConfig?: {
    type: 'grid' | 'list' | 'table' | 'form';
    count?: number;
  };
}

/**
 * Default app logo component
 */
const AppLogo = memo(function AppLogo({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} bg-[var(--app-accent)] rounded-lg flex items-center justify-center`}>
      <span className="text-white font-bold text-lg">S</span>
    </div>
  );
});

/**
 * Progress bar component
 */
const ProgressBar = memo(function ProgressBar({
  progress = 0,
  showPercentage = false
}: {
  progress: number;
  showPercentage?: boolean;
}) {
  return (
    <div className="w-full max-w-md">
      {/* Progress bar */}
      <div className="w-full bg-[var(--app-gray)] rounded-full h-2 overflow-hidden">
        <div
          className="h-2 bg-[var(--app-accent)] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
      
      {/* Percentage */}
      {showPercentage && (
        <div className="text-center mt-2">
          <span className="text-sm text-[var(--app-foreground-muted)]">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
});

/**
 * Centered layout component
 */
const CenteredLayout = memo(function CenteredLayout({
  message,
  logo,
  progress,
  showProgress,
  showBranding
}: Pick<LoadingPageProps, 'message' | 'logo' | 'progress' | 'showProgress' | 'showBranding'>) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6 p-8">
      {/* Logo/Branding */}
      {(showBranding || logo) && (
        <div className="flex flex-col items-center space-y-3">
          {logo || <AppLogo size="lg" />}
          {showBranding && (
            <h1 className="text-xl font-semibold text-[var(--app-foreground)]">
              StickerNet
            </h1>
          )}
        </div>
      )}
      
      {/* Loading spinner */}
      <PageLoadingSpinner message={message} />
      
      {/* Progress bar */}
      {typeof progress === 'number' && (
        <ProgressBar progress={progress} showPercentage={showProgress} />
      )}
    </div>
  );
});

/**
 * Top layout component
 */
const TopLayout = memo(function TopLayout({
  message,
  logo,
  progress,
  showProgress
}: Pick<LoadingPageProps, 'message' | 'logo' | 'progress' | 'showProgress'>) {
  return (
    <div className="min-h-screen">
      {/* Top loading area */}
      <div className="flex flex-col items-center pt-16 pb-8 space-y-4">
        {logo && (
          <div className="mb-2">
            {logo}
          </div>
        )}
        
        <PageLoadingSpinner message={message} />
        
        {typeof progress === 'number' && (
          <ProgressBar progress={progress} showPercentage={showProgress} />
        )}
      </div>
      
      {/* Page content placeholder */}
      <div className="px-4">
        <SkeletonGrid />
      </div>
    </div>
  );
});

/**
 * Skeleton layout component
 */
const SkeletonLayout = memo(function SkeletonLayout({
  skeletonConfig = { type: 'grid', count: 12 }
}: {
  skeletonConfig: NonNullable<LoadingPageProps['skeletonConfig']>;
}) {
  const renderSkeleton = () => {
    switch (skeletonConfig.type) {
      case 'grid':
        return <SkeletonGrid />;
      case 'list':
        return (
          <div className="space-y-4">
            {Array.from({ length: skeletonConfig.count || 8 }, (_, i) => (
              <div key={i} className="flex items-center space-x-3 p-4">
                <div className="w-12 h-12 bg-[var(--app-gray)] animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-4 bg-[var(--app-gray)] animate-pulse rounded" />
                  <div className="w-1/2 h-3 bg-[var(--app-gray)] animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        );
      case 'table':
        return (
          <div className="space-y-2">
            {/* Header */}
            <div className="flex space-x-4 p-4 border-b border-[var(--app-border)]">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex-1 h-4 bg-[var(--app-gray)] animate-pulse rounded" />
              ))}
            </div>
            {/* Rows */}
            {Array.from({ length: skeletonConfig.count || 6 }, (_, i) => (
              <div key={i} className="flex space-x-4 p-4">
                {Array.from({ length: 4 }, (_, j) => (
                  <div key={j} className="flex-1 h-4 bg-[var(--app-gray)] animate-pulse rounded" />
                ))}
              </div>
            ))}
          </div>
        );
      case 'form':
        return (
          <div className="max-w-md mx-auto space-y-6 p-6">
            {Array.from({ length: skeletonConfig.count || 5 }, (_, i) => (
              <div key={i} className="space-y-2">
                <div className="w-1/4 h-4 bg-[var(--app-gray)] animate-pulse rounded" />
                <div className="w-full h-10 bg-[var(--app-gray)] animate-pulse rounded-md" />
              </div>
            ))}
            <div className="w-24 h-10 bg-[var(--app-gray)] animate-pulse rounded-md" />
          </div>
        );
      default:
        return <SkeletonGrid />;
    }
  };

  return (
    <div className="min-h-screen p-4">
      {renderSkeleton()}
    </div>
  );
});

/**
 * Minimal layout component
 */
const MinimalLayout = memo(function MinimalLayout({
  message
}: Pick<LoadingPageProps, 'message'>) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--app-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        {message && (
          <p className="text-sm text-[var(--app-foreground-muted)]">
            {message}
          </p>
        )}
      </div>
    </div>
  );
});

/**
 * Branded layout component
 */
const BrandedLayout = memo(function BrandedLayout({
  message,
  logo,
  progress,
  showProgress
}: Pick<LoadingPageProps, 'message' | 'logo' | 'progress' | 'showProgress'>) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[var(--app-accent)]/10 to-[var(--app-accent)]/5 p-8">
      <div className="bg-[var(--app-card-bg)] border border-[var(--app-border)] rounded-2xl p-8 shadow-xl max-w-sm w-full text-center">
        {/* Logo */}
        <div className="mb-6">
          {logo || <AppLogo size="lg" />}
        </div>
        
        {/* App name */}
        <h1 className="text-2xl font-bold text-[var(--app-foreground)] mb-2">
          StickerNet
        </h1>
        
        {/* Loading message */}
        {message && (
          <p className="text-[var(--app-foreground-muted)] mb-6">
            {message}
          </p>
        )}
        
        {/* Progress */}
        {typeof progress === 'number' ? (
          <ProgressBar progress={progress} showPercentage={showProgress} />
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-[var(--app-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Progress layout component
 */
const ProgressLayout = memo(function ProgressLayout({
  message,
  progress = 0,
  showProgress = true
}: Pick<LoadingPageProps, 'message' | 'progress' | 'showProgress'>) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6 p-8">
      {/* Message */}
      {message && (
        <h2 className="text-xl font-semibold text-[var(--app-foreground)] text-center">
          {message}
        </h2>
      )}
      
      {/* Large progress bar */}
      <div className="w-full max-w-lg">
        <ProgressBar progress={progress} showPercentage={showProgress} />
      </div>
      
      {/* Status text */}
      <p className="text-sm text-[var(--app-foreground-muted)] text-center">
        Please wait while we load your content...
      </p>
    </div>
  );
});

/**
 * Get animation classes
 */
function getAnimationClasses(animation: LoadingPageProps['animation']): string {
  switch (animation) {
    case 'fade':
      return 'animate-fade-in';
    case 'slide':
      return 'animate-slide-in-from-bottom';
    case 'scale':
      return 'animate-scale-in';
    case 'none':
      return '';
    default:
      return 'animate-fade-in';
  }
}

/**
 * Main loading page component
 */
export const LoadingPage = memo(function LoadingPage({
  layout = 'centered',
  message = 'Loading...',
  showBranding = false,
  progress,
  showProgress = false,
  logo,
  className = '',
  backgroundColor,
  animation = 'fade',
  overlay = false,
  skeletonConfig = { type: 'grid', count: 12 }
}: LoadingPageProps) {
  
  // Base classes
  const baseClasses = `
    ${getAnimationClasses(animation)}
    ${overlay ? 'fixed inset-0 z-50' : ''}
    ${className}
  `;

  // Background style
  const backgroundStyle: React.CSSProperties = backgroundColor
    ? { backgroundColor }
    : {};

  // Render layout based on type
  const renderLayout = () => {
    const commonProps = { message, logo, progress, showProgress, showBranding };
    
    switch (layout) {
      case 'centered':
        return <CenteredLayout {...commonProps} />;
      case 'top':
        return <TopLayout {...commonProps} />;
      case 'skeleton':
        return <SkeletonLayout skeletonConfig={skeletonConfig} />;
      case 'minimal':
        return <MinimalLayout message={message} />;
      case 'branded':
        return <BrandedLayout {...commonProps} />;
      case 'progress':
        return <ProgressLayout {...commonProps} />;
      default:
        return <CenteredLayout {...commonProps} />;
    }
  };

  return (
    <div 
      className={baseClasses} 
      style={backgroundStyle}
      role="status"
      aria-label={message}
    >
      {renderLayout()}
    </div>
  );
});

/**
 * App initialization loading page
 */
export const AppLoadingPage = memo(function AppLoadingPage({
  progress,
  message = 'Initializing StickerNet...'
}: {
  progress?: number;
  message?: string;
}) {
  return (
    <LoadingPage
      layout="branded"
      message={message}
      progress={progress}
      showProgress={typeof progress === 'number'}
      showBranding
      animation="scale"
    />
  );
});

/**
 * Page transition loading
 */
export const PageTransitionLoading = memo(function PageTransitionLoading({
  message = 'Loading page...'
}: {
  message?: string;
}) {
  return (
    <LoadingPage
      layout="minimal"
      message={message}
      overlay
      animation="fade"
      backgroundColor="rgba(0, 0, 0, 0.5)"
    />
  );
});

// Export types
export type { PageLoadingLayout };