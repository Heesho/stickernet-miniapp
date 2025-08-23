/**
 * Loading Button Component
 * 
 * Enhanced button component with integrated loading states,
 * progress indicators, and accessibility features.
 */

"use client";

import React, { memo, forwardRef } from 'react';
import { ButtonLoadingSpinner } from './LoadingSpinner.enhanced';

/**
 * Loading button props
 */
export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether button is in loading state */
  loading?: boolean;
  /** Loading text to show during loading */
  loadingText?: string;
  /** Whether to show spinner icon */
  showSpinner?: boolean;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Whether to show progress percentage */
  showProgress?: boolean;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether button takes full width */
  fullWidth?: boolean;
  /** Success state */
  success?: boolean;
  /** Success text */
  successText?: string;
  /** Error state */
  error?: boolean;
  /** Error text */
  errorText?: string;
  /** Duration to show success/error states in ms */
  stateDuration?: number;
  /** Icon to show before text */
  startIcon?: React.ReactNode;
  /** Icon to show after text */
  endIcon?: React.ReactNode;
}

/**
 * Get button variant classes
 */
function getVariantClasses(variant: LoadingButtonProps['variant']): string {
  switch (variant) {
    case 'primary':
      return 'bg-[var(--app-accent)] text-white hover:bg-[var(--app-accent-hover)] focus:ring-[var(--app-accent)]/20';
    case 'secondary':
      return 'bg-[var(--app-gray)] text-[var(--app-foreground)] hover:bg-[var(--app-gray-hover)] focus:ring-[var(--app-gray)]/20';
    case 'outline':
      return 'border border-[var(--app-border)] text-[var(--app-foreground)] hover:bg-[var(--app-gray-light)] focus:ring-[var(--app-accent)]/20';
    case 'ghost':
      return 'text-[var(--app-foreground)] hover:bg-[var(--app-gray-light)] focus:ring-[var(--app-accent)]/20';
    case 'danger':
      return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600/20';
    default:
      return 'bg-[var(--app-accent)] text-white hover:bg-[var(--app-accent-hover)] focus:ring-[var(--app-accent)]/20';
  }
}

/**
 * Get button size classes
 */
function getSizeClasses(size: LoadingButtonProps['size']): string {
  switch (size) {
    case 'sm':
      return 'px-3 py-1.5 text-sm';
    case 'md':
      return 'px-4 py-2 text-sm';
    case 'lg':
      return 'px-6 py-3 text-base';
    default:
      return 'px-4 py-2 text-sm';
  }
}

/**
 * Progress bar component for button
 */
const ButtonProgressBar = memo(function ButtonProgressBar({ 
  progress,
  variant
}: { 
  progress: number;
  variant: LoadingButtonProps['variant'];
}) {
  const progressColor = variant === 'primary' ? 'rgba(255,255,255,0.3)' : 'var(--app-accent)';
  
  return (
    <div className="absolute bottom-0 left-0 h-1 bg-black/10 rounded-b-md overflow-hidden w-full">
      <div
        className="h-full transition-all duration-300 ease-out rounded-b-md"
        style={{
          width: `${Math.max(0, Math.min(100, progress))}%`,
          backgroundColor: progressColor
        }}
      />
    </div>
  );
});

/**
 * Loading button component
 */
export const LoadingButton = memo(forwardRef<HTMLButtonElement, LoadingButtonProps>(
  function LoadingButton(props, ref) {
    const {
      loading = false,
      loadingText,
      showSpinner = true,
      progress,
      showProgress = false,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      success = false,
      successText = 'Success!',
      error = false,
      errorText = 'Error',
      stateDuration = 2000,
      startIcon,
      endIcon,
      children,
      className = '',
      disabled,
      ...restProps
    } = props;
    
    // Determine current state
    const isDisabled = disabled || loading;
    const currentText = loading ? (loadingText || children) :
                      success ? successText :
                      error ? errorText :
                      children;

    // Base classes
    const baseClasses = `
      relative inline-flex items-center justify-center font-medium rounded-md
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      overflow-hidden
    `;

    // Combine classes
    const buttonClasses = `
      ${baseClasses}
      ${getVariantClasses(variant)}
      ${getSizeClasses(size)}
      ${fullWidth ? 'w-full' : ''}
      ${success ? 'bg-green-600 text-white' : ''}
      ${error ? 'bg-red-600 text-white' : ''}
      ${className}
    `;

    // Success/error override for spinner color
    const spinnerVariant = success ? 'white' : error ? 'white' : 'white';

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={isDisabled}
        aria-busy={loading}
        aria-live="polite"
        {...restProps}
      >
        {/* Progress bar */}
        {typeof progress === 'number' && (
          <ButtonProgressBar progress={progress} variant={variant} />
        )}

        {/* Button content */}
        <span className="flex items-center justify-center space-x-2 relative z-10">
          {/* Start icon or loading spinner */}
          {loading && showSpinner ? (
            <ButtonLoadingSpinner />
          ) : success ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : error ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            startIcon
          )}

          {/* Button text */}
          <span>
            {currentText}
            {showProgress && typeof progress === 'number' && (
              <span className="ml-1 opacity-75">
                ({Math.round(progress)}%)
              </span>
            )}
          </span>

          {/* End icon */}
          {!loading && !success && !error && endIcon}
        </span>
      </button>
    );
  }
));

/**
 * Submit button with automatic loading state
 */
export const SubmitButton = memo(forwardRef<HTMLButtonElement, Omit<LoadingButtonProps, 'type'>>(
  function SubmitButton(props, ref) {
    return (
      <LoadingButton
        ref={ref}
        type="submit"
        variant="primary"
        loadingText="Submitting..."
        {...props}
      />
    );
  }
));

/**
 * Async action button with built-in state management
 */
export interface AsyncButtonProps extends Omit<LoadingButtonProps, 'loading' | 'success' | 'error'> {
  /** Async function to execute */
  onClick?: () => Promise<void> | void;
  /** Success message */
  successMessage?: string;
  /** Error message */
  errorMessage?: string;
  /** Whether to reset state after success/error */
  autoReset?: boolean;
  /** Auto reset timeout in ms */
  resetTimeout?: number;
}

export const AsyncButton = memo(forwardRef<HTMLButtonElement, AsyncButtonProps>(
  function AsyncButton({
    onClick,
    successMessage = 'Success!',
    errorMessage = 'Error',
    autoReset = true,
    resetTimeout = 2000,
    children,
    ...props
  }, ref) {
    const [state, setState] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleClick = async () => {
      if (!onClick || state === 'loading') return;

      setState('loading');

      try {
        await onClick();
        setState('success');
        
        if (autoReset) {
          setTimeout(() => setState('idle'), resetTimeout);
        }
      } catch (error) {
        setState('error');
        
        if (autoReset) {
          setTimeout(() => setState('idle'), resetTimeout);
        }
      }
    };

    return (
      <LoadingButton
        ref={ref}
        loading={state === 'loading'}
        success={state === 'success'}
        error={state === 'error'}
        successText={successMessage}
        errorText={errorMessage}
        onClick={handleClick}
        stateDuration={resetTimeout}
        {...props}
      >
        {children}
      </LoadingButton>
    );
  }
));

/**
 * File upload button with progress
 */
export interface UploadButtonProps extends Omit<LoadingButtonProps, 'progress' | 'loading'> {
  /** File upload handler */
  onUpload?: (files: FileList) => Promise<void>;
  /** Accepted file types */
  accept?: string;
  /** Whether to allow multiple files */
  multiple?: boolean;
  /** Upload progress (0-100) */
  uploadProgress?: number;
}

export const UploadButton = memo(forwardRef<HTMLButtonElement, UploadButtonProps>(
  function UploadButton({
    onUpload,
    accept,
    multiple = false,
    uploadProgress,
    children = 'Upload File',
    ...props
  }, ref) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = React.useState(false);

    const handleButtonClick = () => {
      fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !onUpload) return;

      setUploading(true);
      try {
        await onUpload(files);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setUploading(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
        <LoadingButton
          ref={ref}
          loading={uploading}
          loadingText="Uploading..."
          progress={uploadProgress}
          showProgress={uploading && typeof uploadProgress === 'number'}
          onClick={handleButtonClick}
          startIcon={
            !uploading && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )
          }
          {...props}
        >
          {children}
        </LoadingButton>
      </>
    );
  }
));

