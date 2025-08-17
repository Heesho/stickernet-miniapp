/**
 * Type definitions for ErrorMessage component
 */

import type { IconName } from '../Icon/Icon.types';

export interface ErrorMessageProps {
  /** Error title */
  title?: string;
  /** Error message */
  message?: string;
  /** Retry function */
  onRetry?: () => void;
  /** Retry button label */
  retryLabel?: string;
  /** Icon to display */
  icon?: IconName;
  /** Additional CSS classes */
  className?: string;
  /** Visual variant */
  variant?: 'default' | 'compact' | 'inline';
}