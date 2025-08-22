/**
 * Reusable error message component
 * 
 * @description A standardized error message component with optional retry functionality
 * and consistent styling across the application.
 */

"use client";

import React, { memo } from 'react';
import { Button } from '../Button';
import { Icon } from '../Icon';
import type { ErrorMessageProps } from './ErrorMessage.types';

/**
 * Error message component
 * 
 * @param props Error message configuration props
 * @returns Error message element
 */
export const ErrorMessage = memo(function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  icon = 'warning',
  className = '',
  variant = 'default'
}: ErrorMessageProps) {
  const containerClasses = {
    default: 'text-center py-8 animate-fade-in',
    compact: 'text-center py-4 animate-fade-in',
    inline: 'inline-flex items-center gap-2 text-sm animate-fade-in'
  };

  if (variant === 'inline') {
    return (
      <div className={`${containerClasses[variant]} ${className}`}>
        <Icon name={icon} size="sm" className="text-[var(--app-foreground-muted)]" />
        <span className="text-[var(--app-foreground-muted)]">{message || title}</span>
        {onRetry && (
          <Button 
            onClick={onRetry} 
            variant="outline" 
            size="sm"
            className="ml-2"
          >
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      <Icon 
        name={icon} 
        size="lg" 
        className="text-[var(--app-foreground-muted)] mx-auto mb-4" 
      />
      
      {title && variant !== 'compact' && (
        <h3 className="text-lg font-medium text-[var(--app-foreground)] mb-2">
          {title}
        </h3>
      )}
      
      {message && (
        <p className="text-[var(--app-foreground-muted)] mb-4">
          {message}
        </p>
      )}
      
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="outline" 
          className="mt-4"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
});