/**
 * Reusable loading spinner component
 * 
 * @description A customizable loading spinner with different sizes and variants
 * for consistent loading states across the application.
 */

"use client";

import React from 'react';
import type { LoadingSpinnerProps } from './LoadingSpinner.types';

/**
 * Loading spinner component
 * 
 * @param props Spinner configuration props
 * @returns Loading spinner element
 */
export function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  className = '',
  'aria-label': ariaLabel = 'Loading...'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const variantClasses = {
    primary: 'border-[var(--app-accent)] border-t-transparent',
    secondary: 'border-[var(--app-foreground-muted)] border-t-transparent',
    white: 'border-white border-t-transparent',
    accent: 'bg-[var(--app-accent)]'
  };

  if (variant === 'accent') {
    return (
      <div
        className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full animate-pulse ${className}`}
        role="status"
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} border-2 ${variantClasses[variant]} rounded-full animate-spin ${className}`}
      role="status"
      aria-label={ariaLabel}
    />
  );
}