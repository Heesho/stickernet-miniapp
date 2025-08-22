/**
 * Loading Form Component
 * 
 * Form component with integrated loading states, field-level loading,
 * and submission handling.
 */

"use client";

import React, { memo } from 'react';
import { FormSkeleton } from './LoadingSkeleton';
import { LoadingButton, SubmitButton } from './LoadingButton';

/**
 * Loading form props
 */
export interface LoadingFormProps {
  /** Whether form is loading */
  loading?: boolean;
  /** Whether form is submitting */
  submitting?: boolean;
  /** Error state */
  error?: boolean;
  /** Success state */
  success?: boolean;
  /** Form error message */
  errorMessage?: string;
  /** Success message */
  successMessage?: string;
  /** Number of skeleton fields */
  skeletonFields?: number;
  /** Whether to show submit button skeleton */
  showSubmitSkeleton?: boolean;
  /** Submit button text */
  submitText?: string;
  /** Submitting text */
  submittingText?: string;
  /** Form content */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Form submission handler */
  onSubmit?: (e: React.FormEvent) => void;
  /** Reset form function */
  onReset?: () => void;
  /** Whether to show reset button */
  showReset?: boolean;
  /** Reset button text */
  resetText?: string;
  /** Form validation errors */
  validationErrors?: Record<string, string>;
  /** Whether form is disabled */
  disabled?: boolean;
}

/**
 * Form loading state component
 */
const FormLoadingState = memo(function FormLoadingState({
  skeletonFields = 3,
  showSubmitSkeleton = true
}: {
  skeletonFields: number;
  showSubmitSkeleton: boolean;
}) {
  return (
    <FormSkeleton
      fields={skeletonFields}
      showButton={showSubmitSkeleton}
    />
  );
});

/**
 * Form error state component
 */
const FormErrorState = memo(function FormErrorState({
  message = 'Failed to submit form',
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
      <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="text-[var(--app-foreground)] font-medium">Form Error</p>
        <p className="text-sm text-[var(--app-foreground-muted)] mt-1">{message}</p>
      </div>
      {onRetry && (
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
 * Form success state component
 */
const FormSuccessState = memo(function FormSuccessState({
  message = 'Form submitted successfully'
}: {
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
      <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="text-[var(--app-foreground)] font-medium">Success</p>
        <p className="text-sm text-[var(--app-foreground-muted)] mt-1">{message}</p>
      </div>
    </div>
  );
});

/**
 * Form validation errors component
 */
const ValidationErrors = memo(function ValidationErrors({
  errors
}: {
  errors: Record<string, string>;
}) {
  const errorEntries = Object.entries(errors);
  
  if (errorEntries.length === 0) return null;

  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
      <div className="flex">
        <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 className="text-sm font-medium text-red-800">
            Please correct the following errors:
          </h3>
          <ul className="mt-1 text-sm text-red-700 list-disc list-inside space-y-1">
            {errorEntries.map(([field, error]) => (
              <li key={field}>
                <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>: {error}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
});

/**
 * Main loading form component
 */
export const LoadingForm = memo(function LoadingForm({
  loading = false,
  submitting = false,
  error = false,
  success = false,
  errorMessage = 'Failed to submit form',
  successMessage = 'Form submitted successfully',
  skeletonFields = 3,
  showSubmitSkeleton = true,
  submitText = 'Submit',
  submittingText = 'Submitting...',
  children,
  className = '',
  onSubmit,
  onReset,
  showReset = false,
  resetText = 'Reset',
  validationErrors = {},
  disabled = false
}: LoadingFormProps) {
  
  // Form classes
  const formClasses = `
    space-y-4
    ${disabled ? 'opacity-50 pointer-events-none' : ''}
    ${className}
  `;

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled && !submitting && onSubmit) {
      onSubmit(e);
    }
  };

  // Render form content based on state
  const renderFormContent = () => {
    if (loading) {
      return (
        <FormLoadingState
          skeletonFields={skeletonFields}
          showSubmitSkeleton={showSubmitSkeleton}
        />
      );
    }

    if (error && !children) {
      return (
        <FormErrorState
          message={errorMessage}
          onRetry={onReset}
        />
      );
    }

    if (success && !children) {
      return (
        <FormSuccessState
          message={successMessage}
        />
      );
    }

    // Show form content
    return (
      <>
        {/* Validation errors */}
        {Object.keys(validationErrors).length > 0 && (
          <ValidationErrors errors={validationErrors} />
        )}
        
        {/* Form error message */}
        {error && errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}
        
        {/* Success message */}
        {success && successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        )}
        
        {/* Form fields */}
        {children}
        
        {/* Form actions */}
        <div className="flex items-center justify-between pt-4">
          <div>
            {showReset && onReset && (
              <button
                type="button"
                onClick={onReset}
                disabled={disabled || submitting}
                className="px-4 py-2 text-sm font-medium text-[var(--app-foreground-muted)] border border-[var(--app-border)] rounded-md hover:bg-[var(--app-gray-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetText}
              </button>
            )}
          </div>
          
          <SubmitButton
            loading={submitting}
            disabled={disabled}
            loadingText={submittingText}
          >
            {submitText}
          </SubmitButton>
        </div>
      </>
    );
  };

  return (
    <form className={formClasses} onSubmit={handleSubmit}>
      {renderFormContent()}
    </form>
  );
});

/**
 * Form field with loading state
 */
export interface LoadingFormFieldProps {
  /** Field label */
  label?: string;
  /** Whether field is loading */
  loading?: boolean;
  /** Field error message */
  error?: string;
  /** Whether field is required */
  required?: boolean;
  /** Field description */
  description?: string;
  /** Field content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export const LoadingFormField = memo(function LoadingFormField({
  label,
  loading = false,
  error,
  required = false,
  description,
  children,
  className = ''
}: LoadingFormFieldProps) {
  
  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="w-20 h-4 bg-[var(--app-gray)] animate-pulse rounded" />
        <div className="w-full h-10 bg-[var(--app-gray)] animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-[var(--app-foreground)]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Field */}
      {children}
      
      {/* Description */}
      {description && (
        <p className="text-sm text-[var(--app-foreground-muted)]">
          {description}
        </p>
      )}
      
      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

/**
 * Enhanced input component with loading state
 */
export interface LoadingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Whether input is loading */
  loading?: boolean;
  /** Input error */
  error?: string;
  /** Input label */
  label?: string;
  /** Start icon */
  startIcon?: React.ReactNode;
  /** End icon */
  endIcon?: React.ReactNode;
}

export const LoadingInput = memo(function LoadingInput({
  loading = false,
  error,
  label,
  startIcon,
  endIcon,
  className = '',
  ...props
}: LoadingInputProps) {
  
  if (loading) {
    return (
      <div className="space-y-2">
        {label && <div className="w-20 h-4 bg-[var(--app-gray)] animate-pulse rounded" />}
        <div className="w-full h-10 bg-[var(--app-gray)] animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <LoadingFormField label={label} error={error}>
      <div className="relative">
        {/* Start icon */}
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {startIcon}
          </div>
        )}
        
        {/* Input */}
        <input
          className={`
            w-full px-3 py-2 border border-[var(--app-border)] rounded-md
            bg-[var(--app-card-bg)] text-[var(--app-foreground)]
            placeholder-[var(--app-foreground-muted)]
            focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${startIcon ? 'pl-10' : ''}
            ${endIcon ? 'pr-10' : ''}
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        
        {/* End icon */}
        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {endIcon}
          </div>
        )}
      </div>
    </LoadingFormField>
  );
});

// Export types
export type { LoadingFormFieldProps, LoadingInputProps };