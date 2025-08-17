/**
 * Type definitions for LoadingSpinner component
 */

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Visual variant of the spinner */
  variant?: 'primary' | 'secondary' | 'white' | 'accent';
  /** Additional CSS classes */
  className?: string;
  /** Accessibility label */
  'aria-label'?: string;
}