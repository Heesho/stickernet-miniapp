/**
 * Centralized Loading State Management System
 * 
 * This system provides consistent loading state management across the entire application,
 * with support for multiple concurrent operations, error handling, and optimistic updates.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useErrorHandler, type StandardError } from './useErrorHandler';

/**
 * Loading operation types for categorization
 */
export type LoadingOperation = 
  | 'fetch_data'
  | 'submit_form'
  | 'transaction'
  | 'upload'
  | 'auth'
  | 'navigation'
  | 'refresh'
  | 'search'
  | 'pagination'
  | 'mutation'
  | 'background_sync'
  | 'custom';

/**
 * Loading states for different UI contexts
 */
export type LoadingState = 
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'pending'
  | 'retrying';

/**
 * Loading priority levels
 */
export type LoadingPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Loading operation metadata
 */
export interface LoadingOperationMeta {
  /** Unique identifier for the operation */
  id: string;
  /** Type of operation */
  type: LoadingOperation;
  /** Display message while loading */
  message?: string;
  /** Priority level */
  priority: LoadingPriority;
  /** Whether this operation can be cancelled */
  cancellable: boolean;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Start timestamp */
  startTime: number;
  /** Whether to show in global loading indicator */
  showGlobally: boolean;
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Active loading operation
 */
export interface ActiveLoadingOperation extends LoadingOperationMeta {
  /** Current state */
  state: LoadingState;
  /** Error if operation failed */
  error?: StandardError;
  /** Cancel function */
  cancel?: () => void;
  /** Retry function */
  retry?: () => void;
}

/**
 * Configuration for loading state hook
 */
export interface UseLoadingStateConfig {
  /** Hook identifier for debugging */
  hookName: string;
  /** Whether to show loading indicators globally */
  showGlobal?: boolean;
  /** Default loading messages */
  defaultMessages?: Partial<Record<LoadingOperation, string>>;
  /** Minimum loading duration to prevent flickering */
  minLoadingDuration?: number;
  /** Maximum concurrent operations */
  maxConcurrentOps?: number;
  /** Whether to auto-clear success/error states */
  autoClearStates?: boolean;
  /** Auto-clear timeout in ms */
  autoClearTimeout?: number;
}

/**
 * Loading state hook return type
 */
export interface UseLoadingStateReturn {
  /** Current loading state */
  state: LoadingState;
  /** Whether any operation is currently loading */
  isLoading: boolean;
  /** Whether any operation succeeded recently */
  isSuccess: boolean;
  /** Whether any operation failed */
  isError: boolean;
  /** Current error if any */
  error: StandardError | null;
  /** All active operations */
  activeOperations: ActiveLoadingOperation[];
  /** Primary operation (highest priority) */
  primaryOperation: ActiveLoadingOperation | null;
  /** Overall progress (0-100) */
  progress: number;
  /** Start a new loading operation */
  startLoading: (config: Partial<LoadingOperationMeta> & { type: LoadingOperation }) => string;
  /** Update operation progress */
  updateProgress: (operationId: string, progress: number) => void;
  /** Complete operation successfully */
  completeOperation: (operationId: string, result?: any) => void;
  /** Fail operation with error */
  failOperation: (operationId: string, error: unknown) => void;
  /** Cancel operation */
  cancelOperation: (operationId: string) => void;
  /** Clear all operations */
  clearAll: () => void;
  /** Clear specific operation */
  clearOperation: (operationId: string) => void;
  /** Set retry function for operation */
  setRetryFunction: (operationId: string, retryFn: () => void) => void;
  /** Execute async function with automatic loading state */
  executeWithLoading: <T>(
    asyncFn: () => Promise<T>,
    config: Partial<LoadingOperationMeta> & { type: LoadingOperation }
  ) => Promise<T | null>;
}

/**
 * Default loading messages for different operation types
 */
const DEFAULT_LOADING_MESSAGES: Record<LoadingOperation, string> = {
  fetch_data: 'Loading data...',
  submit_form: 'Submitting...',
  transaction: 'Processing transaction...',
  upload: 'Uploading...',
  auth: 'Authenticating...',
  navigation: 'Loading page...',
  refresh: 'Refreshing...',
  search: 'Searching...',
  pagination: 'Loading more...',
  mutation: 'Updating...',
  background_sync: 'Syncing...',
  custom: 'Processing...'
};

/**
 * Generate unique operation ID
 */
function generateOperationId(): string {
  return `load_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Main loading state management hook
 */
export function useLoadingState(config: UseLoadingStateConfig): UseLoadingStateReturn {
  const {
    hookName,
    showGlobal = false,
    defaultMessages = {},
    minLoadingDuration = 300,
    maxConcurrentOps = 10,
    autoClearStates = true,
    autoClearTimeout = 3000
  } = config;

  const [operations, setOperations] = useState<Map<string, ActiveLoadingOperation>>(new Map());
  const clearTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const errorHandler = useErrorHandler({
    hookName: `${hookName}:loadingState`,
    showToast: false, // Handle toasts at operation level
    enableLogging: true
  });

  // Merge default messages
  const messages = useMemo(() => ({
    ...DEFAULT_LOADING_MESSAGES,
    ...defaultMessages
  }), [defaultMessages]);

  // Calculate derived state
  const derivedState = useMemo(() => {
    const ops = Array.from(operations.values());
    
    // Determine overall state based on operations
    let state: LoadingState = 'idle';
    let hasLoading = false;
    let hasSuccess = false;
    let hasError = false;
    let primaryError: StandardError | null = null;

    for (const op of ops) {
      switch (op.state) {
        case 'loading':
        case 'pending':
        case 'retrying':
          hasLoading = true;
          state = 'loading';
          break;
        case 'success':
          hasSuccess = true;
          if (state === 'idle') state = 'success';
          break;
        case 'error':
          hasError = true;
          state = 'error';
          if (op.error && !primaryError) {
            primaryError = op.error;
          }
          break;
      }
    }

    // Find primary operation (highest priority)
    const primaryOperation = ops.length > 0 
      ? ops.reduce((prev, current) => {
          const prevPriority = getPriorityWeight(prev.priority);
          const currentPriority = getPriorityWeight(current.priority);
          return currentPriority > prevPriority ? current : prev;
        })
      : null;

    // Calculate overall progress
    const loadingOps = ops.filter(op => 
      op.state === 'loading' || op.state === 'pending' || op.state === 'retrying'
    );
    const totalProgress = loadingOps.reduce((sum, op) => sum + (op.progress || 0), 0);
    const avgProgress = loadingOps.length > 0 ? totalProgress / loadingOps.length : 0;

    return {
      state,
      isLoading: hasLoading,
      isSuccess: hasSuccess && !hasLoading && !hasError,
      isError: hasError,
      error: primaryError,
      activeOperations: ops,
      primaryOperation,
      progress: Math.round(avgProgress)
    };
  }, [operations]);

  // Helper to get priority weight
  const getPriorityWeight = (priority: LoadingPriority): number => {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  // Clear operation after timeout
  const scheduleAutoClear = useCallback((operationId: string) => {
    if (!autoClearStates) return;

    const timeout = setTimeout(() => {
      setOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(operationId);
        return newMap;
      });
      clearTimeouts.current.delete(operationId);
    }, autoClearTimeout);

    clearTimeouts.current.set(operationId, timeout);
  }, [autoClearStates, autoClearTimeout]);

  // Start loading operation
  const startLoading = useCallback((operationConfig: Partial<LoadingOperationMeta> & { type: LoadingOperation }): string => {
    const operationId = generateOperationId();
    
    // Check concurrent operation limit
    const activeCount = Array.from(operations.values()).filter(op => 
      op.state === 'loading' || op.state === 'pending' || op.state === 'retrying'
    ).length;

    if (activeCount >= maxConcurrentOps) {
      console.warn(`[${hookName}] Maximum concurrent operations (${maxConcurrentOps}) reached`);
      return operationId;
    }

    const operation: ActiveLoadingOperation = {
      id: operationId,
      type: operationConfig.type,
      message: operationConfig.message || messages[operationConfig.type],
      priority: operationConfig.priority || 'medium',
      cancellable: operationConfig.cancellable || false,
      progress: operationConfig.progress || 0,
      startTime: Date.now(),
      showGlobally: operationConfig.showGlobally ?? showGlobal,
      metadata: operationConfig.metadata || {},
      state: 'loading'
    };

    setOperations(prev => new Map(prev).set(operationId, operation));

    return operationId;
  }, [operations, maxConcurrentOps, hookName, messages, showGlobal]);

  // Update operation progress
  const updateProgress = useCallback((operationId: string, progress: number) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      const operation = newMap.get(operationId);
      if (operation) {
        newMap.set(operationId, {
          ...operation,
          progress: Math.max(0, Math.min(100, progress))
        });
      }
      return newMap;
    });
  }, []);

  // Complete operation successfully
  const completeOperation = useCallback((operationId: string, result?: any) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      const operation = newMap.get(operationId);
      if (operation) {
        const duration = Date.now() - operation.startTime;
        const remainingTime = Math.max(0, minLoadingDuration - duration);

        // Ensure minimum loading duration to prevent flickering
        if (remainingTime > 0) {
          setTimeout(() => {
            setOperations(current => {
              const updatedMap = new Map(current);
              const currentOp = updatedMap.get(operationId);
              if (currentOp) {
                updatedMap.set(operationId, {
                  ...currentOp,
                  state: 'success',
                  progress: 100,
                  metadata: { ...currentOp.metadata, result }
                });
                scheduleAutoClear(operationId);
              }
              return updatedMap;
            });
          }, remainingTime);
        } else {
          newMap.set(operationId, {
            ...operation,
            state: 'success',
            progress: 100,
            metadata: { ...operation.metadata, result }
          });
          scheduleAutoClear(operationId);
        }
      }
      return newMap;
    });
  }, [minLoadingDuration, scheduleAutoClear]);

  // Fail operation with error
  const failOperation = useCallback((operationId: string, error: unknown) => {
    const standardError = errorHandler.handleError(error, {
      operationId,
      operationType: operations.get(operationId)?.type
    });

    setOperations(prev => {
      const newMap = new Map(prev);
      const operation = newMap.get(operationId);
      if (operation) {
        newMap.set(operationId, {
          ...operation,
          state: 'error',
          error: standardError
        });
        scheduleAutoClear(operationId);
      }
      return newMap;
    });
  }, [errorHandler, operations, scheduleAutoClear]);

  // Cancel operation
  const cancelOperation = useCallback((operationId: string) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      const operation = newMap.get(operationId);
      if (operation && operation.cancellable) {
        if (operation.cancel) {
          operation.cancel();
        }
        newMap.delete(operationId);
      }
      return newMap;
    });

    // Clear any pending timeout
    const timeout = clearTimeouts.current.get(operationId);
    if (timeout) {
      clearTimeout(timeout);
      clearTimeouts.current.delete(operationId);
    }
  }, []);

  // Clear all operations
  const clearAll = useCallback(() => {
    setOperations(new Map());
    
    // Clear all timeouts
    clearTimeouts.current.forEach(timeout => clearTimeout(timeout));
    clearTimeouts.current.clear();
  }, []);

  // Clear specific operation
  const clearOperation = useCallback((operationId: string) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      newMap.delete(operationId);
      return newMap;
    });

    const timeout = clearTimeouts.current.get(operationId);
    if (timeout) {
      clearTimeout(timeout);
      clearTimeouts.current.delete(operationId);
    }
  }, []);

  // Set retry function for operation
  const setRetryFunction = useCallback((operationId: string, retryFn: () => void) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      const operation = newMap.get(operationId);
      if (operation) {
        newMap.set(operationId, {
          ...operation,
          retry: () => {
            // Reset operation state to loading
            setOperations(current => {
              const updatedMap = new Map(current);
              const currentOp = updatedMap.get(operationId);
              if (currentOp) {
                updatedMap.set(operationId, {
                  ...currentOp,
                  state: 'retrying',
                  error: undefined,
                  progress: 0
                });
              }
              return updatedMap;
            });
            retryFn();
          }
        });
      }
      return newMap;
    });
  }, []);

  // Execute async function with automatic loading state management
  const executeWithLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    operationConfig: Partial<LoadingOperationMeta> & { type: LoadingOperation }
  ): Promise<T | null> => {
    const operationId = startLoading(operationConfig);

    try {
      const result = await asyncFn();
      completeOperation(operationId, result);
      return result;
    } catch (error) {
      failOperation(operationId, error);
      return null;
    }
  }, [startLoading, completeOperation, failOperation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts.current.forEach(timeout => clearTimeout(timeout));
      clearTimeouts.current.clear();
    };
  }, []);

  return {
    ...derivedState,
    startLoading,
    updateProgress,
    completeOperation,
    failOperation,
    cancelOperation,
    clearAll,
    clearOperation,
    setRetryFunction,
    executeWithLoading
  };
}

/**
 * Simplified loading state hook for basic use cases
 */
export function useSimpleLoadingState(hookName: string) {
  return useLoadingState({
    hookName,
    showGlobal: false,
    autoClearStates: true,
    autoClearTimeout: 2000,
    minLoadingDuration: 300
  });
}

/**
 * Global loading state hook for app-wide operations
 */
export function useGlobalLoadingState() {
  return useLoadingState({
    hookName: 'globalLoading',
    showGlobal: true,
    autoClearStates: true,
    autoClearTimeout: 1000,
    minLoadingDuration: 500,
    maxConcurrentOps: 3
  });
}