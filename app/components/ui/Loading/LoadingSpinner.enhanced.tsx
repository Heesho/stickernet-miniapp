/**
 * Enhanced Loading Spinner Component
 * 
 * Extended version of the existing LoadingSpinner with more variants,
 * better animations, and loading states integration.
 */

"use client";

import React, { memo } from 'react';
import type { LoadingSpinnerProps } from '../LoadingSpinner/LoadingSpinner.types';

/**
 * Extended spinner variants
 */
export type SpinnerVariant = 
  | 'primary'
  | 'secondary' 
  | 'white'
  | 'accent'
  | 'dots'
  | 'pulse'
  | 'bars'
  | 'ring'
  | 'orbit'
  | 'ripple'
  | 'gradient';

/**
 * Spinner animation types
 */
export type SpinnerAnimation = 'spin' | 'pulse' | 'bounce' | 'fade' | 'scale';

/**
 * Enhanced spinner props
 */
export interface EnhancedSpinnerProps extends Omit<LoadingSpinnerProps, 'variant'> {
  /** Extended variant options */
  variant?: SpinnerVariant;
  /** Animation type */
  animation?: SpinnerAnimation;
  /** Whether to show loading text */
  showText?: boolean;
  /** Custom loading text */
  text?: string;
  /** Text position relative to spinner */
  textPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** Progress percentage (0-100) for progress spinners */
  progress?: number;
  /** Speed multiplier for animations */
  speed?: number;
  /** Color theme */
  theme?: 'light' | 'dark' | 'auto';
  /** Whether spinner should be inline with text */
  inline?: boolean;
}

/**
 * Size classes mapping
 */
const SPINNER_SIZES = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8', 
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
} as const;

/**
 * Get animation duration based on speed
 */
function getAnimationDuration(speed: number = 1): string {
  const baseDuration = 1000; // 1 second
  return `${baseDuration / speed}ms`;
}

/**
 * Dots spinner component
 */
const DotsSpinner = memo(function DotsSpinner({ 
  size = 'md', 
  speed = 1,
  className = '',
  theme = 'auto'
}: Pick<EnhancedSpinnerProps, 'size' | 'speed' | 'className' | 'theme'>) {
  const dotSize = size === 'sm' ? 'w-1 h-1' : 
                  size === 'md' ? 'w-1.5 h-1.5' :
                  size === 'lg' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  
  const duration = getAnimationDuration(speed);
  
  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${dotSize} bg-[var(--app-accent)] rounded-full animate-pulse`}
          style={{
            animationDelay: `${index * 150}ms`,
            animationDuration: duration
          }}
        />
      ))}
    </div>
  );
});

/**
 * Bars spinner component
 */
const BarsSpinner = memo(function BarsSpinner({ 
  size = 'md', 
  speed = 1,
  className = ''
}: Pick<EnhancedSpinnerProps, 'size' | 'speed' | 'className'>) {
  const barWidth = size === 'sm' ? 'w-0.5' : 
                   size === 'md' ? 'w-1' :
                   size === 'lg' ? 'w-1.5' : 'w-2';
  
  const barHeight = SPINNER_SIZES[size].split(' ')[1]; // Extract height class
  const duration = getAnimationDuration(speed);
  
  return (
    <div className={`flex items-end space-x-0.5 ${className}`}>
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className={`${barWidth} bg-[var(--app-accent)] rounded-sm animate-pulse`}
          style={{
            height: '100%',
            maxHeight: barHeight.replace('h-', '') + 'rem',
            animationDelay: `${index * 100}ms`,
            animationDuration: duration,
            transform: `scaleY(${0.3 + (Math.sin(Date.now() / 200 + index) + 1) * 0.35})`
          }}
        />
      ))}
    </div>
  );
});

/**
 * Ring spinner component
 */
const RingSpinner = memo(function RingSpinner({ 
  size = 'md', 
  speed = 1,
  className = '',
  progress
}: Pick<EnhancedSpinnerProps, 'size' | 'speed' | 'className' | 'progress'>) {
  const sizeClass = SPINNER_SIZES[size];
  const duration = getAnimationDuration(speed);
  
  if (typeof progress === 'number') {
    // Progress ring
    const circumference = 2 * Math.PI * 16; // r=16 for viewBox="0 0 40 40"
    const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;
    
    return (
      <div className={`${sizeClass} ${className}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="var(--app-gray)"
            strokeWidth="3"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="var(--app-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            style={{
              transition: 'stroke-dasharray 0.3s ease'
            }}
          />
        </svg>
      </div>
    );
  }
  
  // Spinning ring
  return (
    <div 
      className={`${sizeClass} border-2 border-[var(--app-gray)] border-t-[var(--app-accent)] rounded-full animate-spin ${className}`}
      style={{ animationDuration: duration }}
    />
  );
});

/**
 * Orbit spinner component
 */
const OrbitSpinner = memo(function OrbitSpinner({ 
  size = 'md', 
  speed = 1,
  className = ''
}: Pick<EnhancedSpinnerProps, 'size' | 'speed' | 'className'>) {
  const sizeClass = SPINNER_SIZES[size];
  const duration = getAnimationDuration(speed);
  
  return (
    <div className={`${sizeClass} relative ${className}`}>
      <div 
        className="absolute inset-0 border border-[var(--app-gray)] rounded-full opacity-30"
      />
      <div 
        className="absolute top-0 left-1/2 w-1 h-1 -ml-0.5 -mt-0.5 bg-[var(--app-accent)] rounded-full animate-spin"
        style={{ 
          animationDuration: duration,
          transformOrigin: `0.5px ${sizeClass.includes('w-4') ? '8px' : 
                           sizeClass.includes('w-8') ? '16px' :
                           sizeClass.includes('w-12') ? '24px' : '32px'}`
        }}
      />
    </div>
  );
});

/**
 * Ripple spinner component
 */
const RippleSpinner = memo(function RippleSpinner({ 
  size = 'md', 
  speed = 1,
  className = ''
}: Pick<EnhancedSpinnerProps, 'size' | 'speed' | 'className'>) {
  const sizeClass = SPINNER_SIZES[size];
  const duration = getAnimationDuration(speed * 2); // Slower for ripple effect
  
  return (
    <div className={`${sizeClass} relative ${className}`}>
      {[0, 1].map((index) => (
        <div
          key={index}
          className="absolute inset-0 border-2 border-[var(--app-accent)] rounded-full animate-ping opacity-75"
          style={{
            animationDelay: `${index * 500}ms`,
            animationDuration: duration
          }}
        />
      ))}
    </div>
  );
});

/**
 * Gradient spinner component
 */
const GradientSpinner = memo(function GradientSpinner({ 
  size = 'md', 
  speed = 1,
  className = ''
}: Pick<EnhancedSpinnerProps, 'size' | 'speed' | 'className'>) {
  const sizeClass = SPINNER_SIZES[size];
  const duration = getAnimationDuration(speed);
  
  return (
    <div 
      className={`${sizeClass} rounded-full animate-spin ${className}`}
      style={{
        background: `conic-gradient(from 0deg, transparent, var(--app-accent))`,
        animationDuration: duration
      }}
    >
      <div className="w-full h-full rounded-full bg-[var(--app-bg)] scale-75" />
    </div>
  );
});

/**
 * Get text positioning classes
 */
function getTextPositionClasses(position: EnhancedSpinnerProps['textPosition']): string {
  switch (position) {
    case 'top':
      return 'flex flex-col items-center space-y-2';
    case 'bottom':
      return 'flex flex-col items-center space-y-2';
    case 'left':
      return 'flex items-center space-x-2';
    case 'right':
      return 'flex items-center space-x-2';
    default:
      return 'flex flex-col items-center space-y-2';
  }
}

/**
 * Enhanced Loading Spinner Component
 */
export const EnhancedLoadingSpinner = memo(function EnhancedLoadingSpinner({
  size = 'md',
  variant = 'primary',
  animation = 'spin',
  className = '',
  'aria-label': ariaLabel = 'Loading...',
  showText = false,
  text = 'Loading...',
  textPosition = 'bottom',
  progress,
  speed = 1,
  theme = 'auto',
  inline = false
}: EnhancedSpinnerProps) {
  
  // Render spinner based on variant
  const renderSpinner = () => {
    const commonProps = { size, speed, className: '', theme };
    
    switch (variant) {
      case 'dots':
        return <DotsSpinner {...commonProps} />;
      case 'bars':
        return <BarsSpinner {...commonProps} />;
      case 'ring':
        return <RingSpinner {...commonProps} progress={progress} />;
      case 'orbit':
        return <OrbitSpinner {...commonProps} />;
      case 'ripple':
        return <RippleSpinner {...commonProps} />;
      case 'gradient':
        return <GradientSpinner {...commonProps} />;
      case 'pulse':
        return (
          <div 
            className={`${SPINNER_SIZES[size]} bg-[var(--app-accent)] rounded-full animate-pulse`}
            style={{ animationDuration: getAnimationDuration(speed) }}
          />
        );
      default:
        // Legacy spinner variants (primary, secondary, white, accent)
        const variantClasses = {
          primary: 'border-[var(--app-accent)] border-t-transparent',
          secondary: 'border-[var(--app-foreground-muted)] border-t-transparent', 
          white: 'border-white border-t-transparent',
          accent: 'bg-[var(--app-accent)]'
        };
        
        if (variant === 'accent') {
          return (
            <div
              className={`${SPINNER_SIZES[size]} ${variantClasses[variant]} rounded-full animate-pulse`}
              style={{ animationDuration: getAnimationDuration(speed) }}
            />
          );
        }
        
        return (
          <div
            className={`${SPINNER_SIZES[size]} border-2 ${variantClasses[variant as 'primary']} rounded-full animate-spin`}
            style={{ animationDuration: getAnimationDuration(speed) }}
          />
        );
    }
  };

  const spinner = (
    <div role="status" aria-label={ariaLabel}>
      {renderSpinner()}
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );

  // Handle inline display
  if (inline) {
    return (
      <span className={`inline-flex items-center space-x-2 ${className}`}>
        {spinner}
        {showText && <span className="text-sm text-[var(--app-foreground-muted)]">{text}</span>}
      </span>
    );
  }

  // Handle text positioning
  if (!showText) {
    return <div className={className}>{spinner}</div>;
  }

  const containerClasses = getTextPositionClasses(textPosition);
  const isReversed = textPosition === 'top' || textPosition === 'left';

  return (
    <div className={`${containerClasses} ${className}`}>
      {isReversed && showText && (
        <span className="text-sm text-[var(--app-foreground-muted)] font-medium">
          {text}
        </span>
      )}
      {spinner}
      {!isReversed && showText && (
        <span className="text-sm text-[var(--app-foreground-muted)] font-medium">
          {text}
        </span>
      )}
    </div>
  );
});

/**
 * Specialized spinner components for common use cases
 */

/**
 * Page loading spinner
 */
export const PageLoadingSpinner = memo(function PageLoadingSpinner({
  message = 'Loading page...',
  ...props
}: Omit<EnhancedSpinnerProps, 'variant' | 'size'> & { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
      <EnhancedLoadingSpinner
        variant="gradient"
        size="lg"
        showText
        text={message}
        {...props}
      />
    </div>
  );
});

/**
 * Button loading spinner
 */
export const ButtonLoadingSpinner = memo(function ButtonLoadingSpinner({
  text = '',
  ...props
}: Omit<EnhancedSpinnerProps, 'variant' | 'size' | 'inline'>) {
  return (
    <EnhancedLoadingSpinner
      variant="white"
      size="sm"
      inline
      showText={!!text}
      text={text}
      {...props}
    />
  );
});

/**
 * Form loading spinner
 */
export const FormLoadingSpinner = memo(function FormLoadingSpinner({
  message = 'Processing...',
  ...props
}: Omit<EnhancedSpinnerProps, 'variant'>) {
  return (
    <div className="flex items-center justify-center p-8">
      <EnhancedLoadingSpinner
        variant="ring"
        size="md"
        showText
        text={message}
        {...props}
      />
    </div>
  );
});

/**
 * Progress spinner with percentage
 */
export const ProgressSpinner = memo(function ProgressSpinner({
  progress,
  showPercentage = true,
  ...props
}: EnhancedSpinnerProps & { showPercentage?: boolean }) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative">
        <EnhancedLoadingSpinner
          variant="ring"
          progress={progress}
          {...props}
        />
        {showPercentage && typeof progress === 'number' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-[var(--app-foreground)]">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

// Export types
export type {
  SpinnerVariant,
  SpinnerAnimation,
  EnhancedSpinnerProps
};