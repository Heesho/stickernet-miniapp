/**
 * Barrel exports for custom hooks
 * 
 * This file provides convenient access to all custom hooks
 * from a single import location.
 */

// Existing hooks
export { useBaseAccount } from './useBaseAccount';
export { useCurateContent } from './useCurateContent';
export { useContentData, useTokenData, createContractCallResult } from './useMulticall';

// New custom hooks for better state management
export { useCurateData } from './useCurateData';
export { useInfiniteScroll } from './useInfiniteScroll';
export { useIntersectionObserver } from './useIntersectionObserver';
export { usePullToRefresh } from './usePullToRefresh';
export { useVisibilityPolling } from './useVisibilityPolling';