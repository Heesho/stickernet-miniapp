/**
 * Global Loading Context
 * 
 * Provides centralized loading state management across the entire application.
 * This context manages global loading indicators, progress bars, and loading overlays.
 */

"use client";

import React, { createContext, useContext, type ReactNode } from 'react';
import { useLoadingState, type UseLoadingStateReturn } from '@/app/hooks/useLoadingState';

/**
 * Global loading context type
 */
interface LoadingContextType extends UseLoadingStateReturn {
  /** Show global loading overlay */
  showGlobalOverlay: (message?: string) => string;
  /** Hide global loading overlay */
  hideGlobalOverlay: () => void;
  /** Show page transition loading */
  showPageTransition: (message?: string) => string;
  /** Hide page transition loading */
  hidePageTransition: () => void;
}

/**
 * Loading context
 */
const LoadingContext = createContext<LoadingContextType | null>(null);

/**
 * Loading provider props
 */
interface LoadingProviderProps {
  children: ReactNode;
}

/**
 * Global loading provider component
 */
export function LoadingProvider({ children }: LoadingProviderProps) {
  const loadingState = useLoadingState({
    hookName: 'GlobalLoadingProvider',
    showGlobal: true,
    autoClearStates: true,
    autoClearTimeout: 1000,
    minLoadingDuration: 500,
    maxConcurrentOps: 5,
    defaultMessages: {
      navigation: 'Loading page...',
      fetch_data: 'Loading content...',
      transaction: 'Processing transaction...',
      submit_form: 'Submitting...',
      upload: 'Uploading files...',
      auth: 'Authenticating...',
      refresh: 'Refreshing data...',
      search: 'Searching...',
      pagination: 'Loading more results...',
      mutation: 'Updating data...',
      background_sync: 'Syncing in background...',
      custom: 'Processing...'
    }
  });

  // Show global loading overlay
  const showGlobalOverlay = (message?: string): string => {
    return loadingState.startLoading({
      type: 'custom',
      message: message || 'Loading...',
      priority: 'high',
      showGlobally: true,
      cancellable: false,
      metadata: { isGlobalOverlay: true }
    });
  };

  // Hide global loading overlay
  const hideGlobalOverlay = (): void => {
    const overlayOps = loadingState.activeOperations.filter(
      op => op.metadata?.isGlobalOverlay === true
    );
    overlayOps.forEach(op => loadingState.completeOperation(op.id));
  };

  // Show page transition loading
  const showPageTransition = (message?: string): string => {
    return loadingState.startLoading({
      type: 'navigation',
      message: message || 'Loading page...',
      priority: 'high',
      showGlobally: true,
      cancellable: false,
      metadata: { isPageTransition: true }
    });
  };

  // Hide page transition loading
  const hidePageTransition = (): void => {
    const transitionOps = loadingState.activeOperations.filter(
      op => op.metadata?.isPageTransition === true
    );
    transitionOps.forEach(op => loadingState.completeOperation(op.id));
  };

  const contextValue: LoadingContextType = {
    ...loadingState,
    showGlobalOverlay,
    hideGlobalOverlay,
    showPageTransition,
    hidePageTransition
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
}

/**
 * Hook to access global loading context
 */
export function useGlobalLoading(): LoadingContextType {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within a LoadingProvider');
  }
  return context;
}

/**
 * Hook for component-level loading with global fallback
 */
export function useComponentLoading(componentName: string) {
  const globalLoading = useGlobalLoading();
  
  const componentLoading = useLoadingState({
    hookName: `Component:${componentName}`,
    showGlobal: false,
    autoClearStates: true,
    autoClearTimeout: 2000,
    minLoadingDuration: 300
  });

  // Helper to escalate to global loading for critical operations
  const escalateToGlobal = (
    operationType: string,
    message?: string,
    priority: 'medium' | 'high' | 'critical' = 'high'
  ): string => {
    return globalLoading.startLoading({
      type: 'custom',
      message: message || `${componentName}: ${operationType}`,
      priority,
      showGlobally: true,
      cancellable: false,
      metadata: { 
        component: componentName,
        escalated: true 
      }
    });
  };

  return {
    ...componentLoading,
    escalateToGlobal,
    globalLoading
  };
}