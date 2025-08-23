/**
 * Standardized Error Handling System for Hooks
 * 
 * This utility provides consistent error handling across all hooks in the application,
 * with proper categorization, user-friendly messages, and recovery suggestions.
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error categories for better handling and recovery
 */
export type ErrorCategory = 
  | 'network'
  | 'validation'
  | 'contract'
  | 'wallet'
  | 'api'
  | 'permission'
  | 'ratelimit'
  | 'timeout'
  | 'unknown';

/**
 * Recovery action types
 */
export type RecoveryAction = 
  | 'retry'
  | 'refresh'
  | 'reconnect'
  | 'switch_network'
  | 'contact_support'
  | 'wait'
  | 'none';

/**
 * Standardized error structure
 */
export interface StandardError {
  /** Error identifier for tracking */
  id: string;
  /** Error category for handling logic */
  category: ErrorCategory;
  /** Severity level */
  severity: ErrorSeverity;
  /** Technical error code (if available) */
  code?: string | number;
  /** Raw error message for debugging */
  message: string;
  /** User-friendly error message */
  userMessage: string;
  /** Detailed description for advanced users */
  details?: string;
  /** Whether this error can be retried */
  retryable: boolean;
  /** Suggested recovery action */
  recoveryAction: RecoveryAction;
  /** Recovery suggestion text */
  recoverySuggestion: string;
  /** Timestamp when error occurred */
  timestamp: number;
  /** Additional context data */
  context?: Record<string, any>;
}

/**
 * Error handling configuration
 */
export interface ErrorHandlerConfig {
  /** Hook name for context */
  hookName: string;
  /** Whether to show toast notifications */
  showToast?: boolean;
  /** Whether to log errors to console */
  enableLogging?: boolean;
  /** Custom error mapping function */
  customErrorMapper?: (error: unknown) => Partial<StandardError>;
  /** Default recovery action for unmapped errors */
  defaultRecoveryAction?: RecoveryAction;
}

/**
 * Error handler return type
 */
export interface ErrorHandlerReturn {
  /** Current error state */
  error: StandardError | null;
  /** Whether there's an active error */
  hasError: boolean;
  /** Error severity level */
  severity: ErrorSeverity | null;
  /** Whether the error is retryable */
  canRetry: boolean;
  /** Set/handle a new error */
  handleError: (error: unknown, context?: Record<string, unknown>) => StandardError;
  /** Clear the current error */
  clearError: () => void;
  /** Retry function (if applicable) */
  retry: (() => void) | null;
  /** Set retry function */
  setRetryFunction: (retryFn: (() => void) | null) => void;
  /** Get user-friendly error message */
  getErrorMessage: () => string;
  /** Get recovery suggestion */
  getRecoverySuggestion: () => string;
}

/**
 * Error code mappings for common scenarios
 */
const ERROR_CODE_MAPPINGS: Record<string | number, Partial<StandardError>> = {
  // Wallet/User errors
  4001: {
    category: 'wallet',
    severity: 'low',
    userMessage: 'Transaction was cancelled by user',
    retryable: true,
    recoveryAction: 'retry',
    recoverySuggestion: 'Please try the transaction again when ready.'
  },
  
  // Network errors
  'NETWORK_ERROR': {
    category: 'network',
    severity: 'medium',
    userMessage: 'Network connection issue',
    retryable: true,
    recoveryAction: 'retry',
    recoverySuggestion: 'Check your internet connection and try again.'
  },
  
  // Rate limiting
  429: {
    category: 'ratelimit',
    severity: 'medium',
    userMessage: 'Too many requests',
    retryable: true,
    recoveryAction: 'wait',
    recoverySuggestion: 'Please wait a moment before trying again.'
  },
  
  // Contract errors
  'CALL_EXCEPTION': {
    category: 'contract',
    severity: 'high',
    userMessage: 'Transaction would fail',
    retryable: false,
    recoveryAction: 'refresh',
    recoverySuggestion: 'This may be due to insufficient funds or market conditions. Please refresh and try again.'
  },
  
  // API errors
  'FETCH_ERROR': {
    category: 'api',
    severity: 'medium',
    userMessage: 'Failed to fetch data',
    retryable: true,
    recoveryAction: 'retry',
    recoverySuggestion: 'Please try again in a moment.'
  }
};

/**
 * Message patterns for automatic error categorization
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  recoveryAction: RecoveryAction;
}> = [
  // Network patterns
  {
    pattern: /network|rpc|connection|timeout|fetch/i,
    category: 'network',
    severity: 'medium',
    retryable: true,
    recoveryAction: 'retry'
  },
  
  // Wallet patterns
  {
    pattern: /wallet|metamask|coinbase|rejected|denied/i,
    category: 'wallet',
    severity: 'low',
    retryable: true,
    recoveryAction: 'retry'
  },
  
  // Contract patterns
  {
    pattern: /revert|insufficient|gas|slippage|deadline/i,
    category: 'contract',
    severity: 'high',
    retryable: false,
    recoveryAction: 'refresh'
  },
  
  // Validation patterns
  {
    pattern: /invalid|required|missing|malformed/i,
    category: 'validation',
    severity: 'medium',
    retryable: false,
    recoveryAction: 'none'
  },
  
  // Rate limiting patterns
  {
    pattern: /rate.?limit|too.?many/i,
    category: 'ratelimit',
    severity: 'medium',
    retryable: true,
    recoveryAction: 'wait'
  }
];

/**
 * Generate a unique error ID
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Categorize error based on patterns and known codes
 */
function categorizeError(error: unknown): Partial<StandardError> {
  const errorObj = error as { message?: string; code?: string | number; name?: string };
  const message = errorObj?.message || String(error);
  const code = errorObj?.code || errorObj?.name;
  
  // Check known error codes first
  if (code && ERROR_CODE_MAPPINGS[code]) {
    return ERROR_CODE_MAPPINGS[code];
  }
  
  // Check message patterns
  for (const { pattern, category, severity, retryable, recoveryAction } of ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return {
        category,
        severity,
        retryable,
        recoveryAction,
        userMessage: generateUserMessage(category),
        recoverySuggestion: generateRecoverySuggestion(recoveryAction)
      };
    }
  }
  
  // Default unknown error
  return {
    category: 'unknown',
    severity: 'medium',
    retryable: true,
    recoveryAction: 'retry',
    userMessage: 'An unexpected error occurred',
    recoverySuggestion: 'Please try again. If the problem persists, contact support.'
  };
}

/**
 * Generate user-friendly message based on category
 */
function generateUserMessage(category: ErrorCategory): string {
  const messages: Record<ErrorCategory, string> = {
    network: 'Connection issue detected',
    validation: 'Invalid input provided',
    contract: 'Transaction cannot be completed',
    wallet: 'Wallet operation failed',
    api: 'Service temporarily unavailable',
    permission: 'Permission denied',
    ratelimit: 'Rate limit exceeded',
    timeout: 'Operation timed out',
    unknown: 'An unexpected error occurred'
  };
  
  return messages[category];
}

/**
 * Generate recovery suggestion based on action
 */
function generateRecoverySuggestion(action: RecoveryAction): string {
  const suggestions: Record<RecoveryAction, string> = {
    retry: 'Please try the operation again.',
    refresh: 'Refresh the page and try again.',
    reconnect: 'Please reconnect your wallet and try again.',
    switch_network: 'Please switch to the correct network.',
    contact_support: 'If the problem persists, please contact support.',
    wait: 'Please wait a moment and try again.',
    none: 'Please check your input and try again.'
  };
  
  return suggestions[action];
}

/**
 * Main error handler hook
 */
export function useErrorHandler(config: ErrorHandlerConfig): ErrorHandlerReturn {
  const [error, setError] = useState<StandardError | null>(null);
  const [retryFunction, setRetryFunction] = useState<(() => void) | null>(null);
  
  const {
    hookName,
    showToast = true,
    enableLogging = true,
    customErrorMapper,
    defaultRecoveryAction = 'retry'
  } = config;
  
  const handleError = useCallback((rawError: unknown, context?: Record<string, unknown>): StandardError => {
    const timestamp = Date.now();
    
    // Apply custom error mapping if provided
    let customMapping: Partial<StandardError> = {};
    if (customErrorMapper) {
      try {
        customMapping = customErrorMapper(rawError) || {};
      } catch (mappingError) {
        if (enableLogging) {
          console.warn(`Error in custom error mapper for ${hookName}:`, mappingError);
        }
      }
    }
    
    // Categorize the error
    const categorized = categorizeError(rawError);
    
    // Build the standardized error
    const errorAsAny = rawError as any;
    const standardError: StandardError = {
      id: generateErrorId(),
      category: customMapping.category || categorized.category || 'unknown',
      severity: customMapping.severity || categorized.severity || 'medium',
      code: customMapping.code || errorAsAny?.code || errorAsAny?.name,
      message: errorAsAny?.message || String(rawError),
      userMessage: customMapping.userMessage || categorized.userMessage || generateUserMessage(categorized.category || 'unknown'),
      details: customMapping.details || errorAsAny?.details,
      retryable: customMapping.retryable ?? categorized.retryable ?? true,
      recoveryAction: customMapping.recoveryAction || categorized.recoveryAction || defaultRecoveryAction,
      recoverySuggestion: customMapping.recoverySuggestion || categorized.recoverySuggestion || generateRecoverySuggestion(defaultRecoveryAction),
      timestamp,
      context: {
        hookName,
        ...context,
        ...(customMapping.context || {})
      }
    };
    
    // Log the error if enabled
    if (enableLogging) {
      const logLevel = standardError.severity === 'critical' ? 'error' : 
                     standardError.severity === 'high' ? 'warn' : 'info';
      
      console[logLevel](`[${hookName}] Error ${standardError.id}:`, {
        category: standardError.category,
        severity: standardError.severity,
        message: standardError.message,
        userMessage: standardError.userMessage,
        retryable: standardError.retryable,
        context: standardError.context,
        rawError
      });
    }
    
    // Show toast notification if enabled
    if (showToast && standardError.severity !== 'low') {
      const toastFn = standardError.severity === 'critical' ? toast.error :
                     standardError.severity === 'high' ? toast.error :
                     toast.warning;
      
      toastFn(standardError.userMessage, {
        description: standardError.recoverySuggestion,
        duration: standardError.severity === 'critical' ? 10000 : 5000
      });
    }
    
    setError(standardError);
    return standardError;
  }, [hookName, showToast, enableLogging, customErrorMapper, defaultRecoveryAction]);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  const setRetryFunctionWrapper = useCallback((retryFn: (() => void) | null) => {
    setRetryFunction(() => retryFn);
  }, []);
  
  const retry = useCallback(() => {
    if (retryFunction) {
      clearError();
      retryFunction();
    }
  }, [retryFunction, clearError]);
  
  const derived = useMemo(() => ({
    hasError: !!error,
    severity: error?.severity || null,
    canRetry: !!(error?.retryable && retryFunction),
    getErrorMessage: () => error?.userMessage || '',
    getRecoverySuggestion: () => error?.recoverySuggestion || ''
  }), [error, retryFunction]);
  
  return {
    error,
    ...derived,
    handleError,
    clearError,
    retry: derived.canRetry ? retry : null,
    setRetryFunction: setRetryFunctionWrapper
  };
}

/**
 * Specialized error handler for async operations
 */
export function useAsyncErrorHandler(config: ErrorHandlerConfig) {
  const errorHandler = useErrorHandler(config);
  
  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    try {
      errorHandler.clearError();
      const result = await operation();
      return result;
    } catch (error) {
      errorHandler.handleError(error, context);
      return null;
    }
  }, [errorHandler]);
  
  return {
    ...errorHandler,
    executeWithErrorHandling
  };
}

/**
 * Error boundary hook for React error boundaries
 */
export function useErrorBoundary(hookName: string) {
  const errorHandler = useErrorHandler({ 
    hookName, 
    showToast: false, // Error boundaries should handle UI
    enableLogging: true 
  });
  
  const captureError = useCallback((error: Error, errorInfo: Record<string, unknown>) => {
    errorHandler.handleError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });
  }, [errorHandler]);
  
  return {
    ...errorHandler,
    captureError
  };
}

/**
 * Utility to check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const categorized = categorizeError(error);
  return categorized.retryable ?? true;
}

/**
 * Utility to get error severity
 */
export function getErrorSeverity(error: unknown): ErrorSeverity {
  const categorized = categorizeError(error);
  return categorized.severity || 'medium';
}

/**
 * Utility to format error for display
 */
export function formatErrorForDisplay(error: StandardError): {
  title: string;
  message: string;
  action?: string;
} {
  return {
    title: error.userMessage,
    message: error.recoverySuggestion,
    action: error.retryable ? 'Retry' : undefined
  };
}