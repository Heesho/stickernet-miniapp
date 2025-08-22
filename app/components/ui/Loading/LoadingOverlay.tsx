/**
 * Loading Overlay Component
 * 
 * Provides full-screen and component-level loading overlays with
 * backdrop blur, progress indicators, and cancellation support.
 */

"use client";

import React, { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { EnhancedLoadingSpinner, type SpinnerVariant } from './LoadingSpinner.enhanced';
import { useGlobalLoading } from '@/app/contexts/LoadingContext';

/**
 * Overlay size variants
 */
export type OverlaySize = 'sm' | 'md' | 'lg' | 'full' | 'auto';

/**
 * Overlay position options
 */
export type OverlayPosition = 'center' | 'top' | 'bottom';

/**
 * Loading overlay props
 */
export interface LoadingOverlayProps {
  /** Whether overlay is visible */
  visible: boolean;
  /** Loading message */
  message?: string;
  /** Spinner variant */
  spinnerVariant?: SpinnerVariant;
  /** Whether overlay covers full screen */
  fullScreen?: boolean;
  /** Overlay size when not fullscreen */
  size?: OverlaySize;
  /** Position of loading content */
  position?: OverlayPosition;
  /** Whether clicking backdrop dismisses overlay */
  dismissOnBackdrop?: boolean;
  /** Callback when overlay is dismissed */
  onDismiss?: () => void;
  /** Whether to show cancel button */
  showCancel?: boolean;
  /** Cancel button text */
  cancelText?: string;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Whether to show progress percentage */
  showProgress?: boolean;
  /** Custom backdrop color */
  backdropColor?: string;
  /** Backdrop blur intensity */
  backdropBlur?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Animation duration in ms */
  animationDuration?: number;
  /** Additional CSS classes */
  className?: string;
  /** Children to render instead of default content */
  children?: React.ReactNode;
  /** Z-index value */
  zIndex?: number;
  /** Portal container element */
  portalContainer?: Element | null;
}

/**
 * Get overlay size classes
 */
function getOverlaySizeClasses(size: OverlaySize): string {
  switch (size) {
    case 'sm':
      return 'max-w-sm max-h-sm';
    case 'md':
      return 'max-w-md max-h-md';
    case 'lg':
      return 'max-w-lg max-h-lg';
    case 'full':
      return 'w-full h-full';
    case 'auto':
    default:
      return 'w-auto h-auto';
  }
}

/**
 * Get position classes
 */
function getPositionClasses(position: OverlayPosition): string {
  switch (position) {
    case 'top':
      return 'items-start pt-16';
    case 'bottom':
      return 'items-end pb-16';
    case 'center':
    default:
      return 'items-center';
  }
}

/**
 * Get backdrop blur classes
 */
function getBackdropBlurClasses(blur: LoadingOverlayProps['backdropBlur']): string {
  switch (blur) {
    case 'sm':
      return 'backdrop-blur-sm';
    case 'md':
      return 'backdrop-blur-md';
    case 'lg':
      return 'backdrop-blur-lg';
    case 'xl':
      return 'backdrop-blur-xl';
    case 'none':
      return '';
    default:
      return 'backdrop-blur-sm';
  }
}

/**
 * Loading overlay content component
 */
const OverlayContent = memo(function OverlayContent({
  message,
  spinnerVariant = 'gradient',
  progress,
  showProgress = false,
  showCancel = false,
  cancelText = 'Cancel',
  onCancel
}: Pick<LoadingOverlayProps, 'message' | 'spinnerVariant' | 'progress' | 'showProgress' | 'showCancel' | 'cancelText' | 'onCancel'>) {
  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-[var(--app-card-bg)] border border-[var(--app-border)] rounded-lg shadow-lg max-w-sm mx-4">
      {/* Spinner */}
      <EnhancedLoadingSpinner
        variant={spinnerVariant}
        size="lg"
        progress={progress}
        speed={0.8}
      />
      
      {/* Progress percentage */}
      {showProgress && typeof progress === 'number' && (
        <div className="text-lg font-semibold text-[var(--app-foreground)]">
          {Math.round(progress)}%
        </div>
      )}
      
      {/* Loading message */}
      {message && (
        <div className="text-center">
          <p className="text-[var(--app-foreground)] font-medium">
            {message}
          </p>
        </div>
      )}
      
      {/* Cancel button */}
      {showCancel && onCancel && (
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)] border border-[var(--app-border)] rounded-md hover:bg-[var(--app-gray-light)] transition-colors"
        >
          {cancelText}
        </button>
      )}
    </div>
  );
});

/**
 * Main loading overlay component
 */
export const LoadingOverlay = memo(function LoadingOverlay({
  visible,
  message,
  spinnerVariant = 'gradient',
  fullScreen = false,
  size = 'auto',
  position = 'center',
  dismissOnBackdrop = false,
  onDismiss,
  showCancel = false,
  cancelText = 'Cancel',
  onCancel,
  progress,
  showProgress = false,
  backdropColor = 'rgba(0, 0, 0, 0.5)',
  backdropBlur = 'sm',
  animationDuration = 200,
  className = '',
  children,
  zIndex = 9999,
  portalContainer
}: LoadingOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle visibility animations
  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), animationDuration);
      return () => clearTimeout(timer);
    }
  }, [visible, animationDuration]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && dismissOnBackdrop && onDismiss) {
      onDismiss();
    }
  };

  // Handle escape key
  useEffect(() => {
    if (!visible || !dismissOnBackdrop) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onDismiss) {
        onDismiss();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [visible, dismissOnBackdrop, onDismiss]);

  // Don't render if not visible and not animating
  if (!visible && !isAnimating) return null;

  const overlayElement = (
    <div
      className={`
        fixed inset-0 flex justify-center transition-all duration-${animationDuration}
        ${getPositionClasses(position)}
        ${getBackdropBlurClasses(backdropBlur)}
        ${visible ? 'opacity-100' : 'opacity-0'}
        ${className}
      `}
      style={{ 
        backgroundColor: backdropColor,
        zIndex: zIndex
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={message || 'Loading'}
    >
      <div
        className={`
          transform transition-all duration-${animationDuration}
          ${getOverlaySizeClasses(fullScreen ? 'full' : size)}
          ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {children || (
          <OverlayContent
            message={message}
            spinnerVariant={spinnerVariant}
            progress={progress}
            showProgress={showProgress}
            showCancel={showCancel}
            cancelText={cancelText}
            onCancel={onCancel}
          />
        )}
      </div>
    </div>
  );

  // Render in portal if fullscreen or specific container
  if (mounted && (fullScreen || portalContainer)) {
    const container = portalContainer || document.body;
    return createPortal(overlayElement, container);
  }

  // Render inline
  return overlayElement;
});

/**
 * Global loading overlay hook
 */
export function useLoadingOverlay() {
  const [overlayState, setOverlayState] = useState<{
    visible: boolean;
    message?: string;
    progress?: number;
    cancellable?: boolean;
    onCancel?: () => void;
  }>({
    visible: false
  });

  const show = (options: {
    message?: string;
    progress?: number;
    cancellable?: boolean;
    onCancel?: () => void;
  } = {}) => {
    setOverlayState({
      visible: true,
      ...options
    });
  };

  const hide = () => {
    setOverlayState(prev => ({ ...prev, visible: false }));
  };

  const updateProgress = (progress: number) => {
    setOverlayState(prev => ({ ...prev, progress }));
  };

  const updateMessage = (message: string) => {
    setOverlayState(prev => ({ ...prev, message }));
  };

  return {
    ...overlayState,
    show,
    hide,
    updateProgress,
    updateMessage
  };
}

/**
 * Page loading overlay component
 */
export const PageLoadingOverlay = memo(function PageLoadingOverlay({
  visible,
  message = 'Loading page...',
  ...props
}: Pick<LoadingOverlayProps, 'visible' | 'message'> & Partial<LoadingOverlayProps>) {
  return (
    <LoadingOverlay
      visible={visible}
      message={message}
      fullScreen
      spinnerVariant="gradient"
      backdropBlur="md"
      {...props}
    />
  );
});

/**
 * Component loading overlay for wrapping specific components
 */
export const ComponentLoadingOverlay = memo(function ComponentLoadingOverlay({
  loading,
  children,
  message = 'Loading...',
  spinnerVariant = 'ring',
  className = ''
}: {
  loading: boolean;
  children: React.ReactNode;
  message?: string;
  spinnerVariant?: SpinnerVariant;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--app-bg)]/80 backdrop-blur-sm rounded-lg">
          <OverlayContent
            message={message}
            spinnerVariant={spinnerVariant}
          />
        </div>
      )}
    </div>
  );
});

/**
 * Global loading overlay component that integrates with LoadingContext
 */
export const GlobalLoadingOverlay = memo(function GlobalLoadingOverlay() {
  const { primaryOperation, isLoading } = useGlobalLoading();

  const shouldShow = isLoading && primaryOperation?.showGlobally;
  const message = primaryOperation?.message;
  const progress = primaryOperation?.progress;
  const showCancel = primaryOperation?.cancellable;

  if (!shouldShow) return null;

  return (
    <LoadingOverlay
      visible
      message={message}
      progress={progress}
      showProgress={typeof progress === 'number'}
      showCancel={showCancel}
      fullScreen
      spinnerVariant="gradient"
      backdropBlur="md"
      dismissOnBackdrop={false}
    />
  );
});

// Export types
export type {
  OverlaySize,
  OverlayPosition
};