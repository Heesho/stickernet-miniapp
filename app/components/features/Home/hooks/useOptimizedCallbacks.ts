/**
 * Custom hook for optimized event handlers and callbacks
 * 
 * @description Provides memoized event handlers and callbacks for the Home component
 * to prevent unnecessary re-renders and optimize performance.
 */

"use client";

import { useCallback, useMemo } from "react";
import type { Curate } from "@/lib/constants";

interface UseOptimizedCallbacksProps {
  /** Handler for showing curate in modal */
  onShowCurate: (curate: Curate) => void;
  /** Handler for closing curate modal */
  onCloseCurate: () => void;
  /** Handler for navigation to sticker */
  onNavigateToSticker: (curate: Curate) => void;
  /** Handler for navigation to board */
  onNavigateToBoard: (tokenId: string, tokenAddress: string) => void;
  /** Handler for curate success */
  onCurateSuccess: () => void;
}

interface UseOptimizedCallbacksReturn {
  /** Optimized image click handler */
  handleImageClick: (curate: Curate) => void;
  /** Optimized modal close handler */
  handleModalClose: () => void;
  /** Optimized curate success handler */
  handleCurateSuccess: () => void;
  /** Optimized board navigation handler */
  handleBoardNavigation: (tokenId: string, tokenAddress: string) => void;
  /** Memoized curate click handler factory */
  createCurateClickHandler: (curate: Curate) => () => void;
}

export function useOptimizedCallbacks({
  onShowCurate,
  onCloseCurate,
  onNavigateToSticker,
  onNavigateToBoard,
  onCurateSuccess,
}: UseOptimizedCallbacksProps): UseOptimizedCallbacksReturn {
  
  // Memoized image click handler that navigates to sticker page
  const handleImageClick = useCallback((curate: Curate) => {
    onNavigateToSticker(curate);
  }, [onNavigateToSticker]);

  // Memoized modal close handler
  const handleModalClose = useCallback(() => {
    onCloseCurate();
  }, [onCloseCurate]);

  // Memoized curate success handler
  const handleCurateSuccess = useCallback(() => {
    onCurateSuccess();
  }, [onCurateSuccess]);

  // Memoized board navigation handler
  const handleBoardNavigation = useCallback((tokenId: string, tokenAddress: string) => {
    onNavigateToBoard(tokenId, tokenAddress);
  }, [onNavigateToBoard]);

  // Factory for creating optimized curate click handlers
  // This prevents creating new functions on every render for each curate
  const createCurateClickHandler = useCallback((curate: Curate) => {
    return () => handleImageClick(curate);
  }, [handleImageClick]);

  // Memoize all handlers to prevent unnecessary re-renders
  const memoizedHandlers = useMemo(() => ({
    handleImageClick,
    handleModalClose,
    handleCurateSuccess,
    handleBoardNavigation,
    createCurateClickHandler,
  }), [
    handleImageClick,
    handleModalClose,
    handleCurateSuccess,
    handleBoardNavigation,
    createCurateClickHandler,
  ]);

  return memoizedHandlers;
}