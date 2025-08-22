/**
 * Custom hook for managing Home component interactions
 * 
 * @description Handles user interactions like curate success, refresh actions,
 * and other business logic with optimized callback management.
 */

"use client";

import { useCallback } from "react";
import { useCurateData } from "@/app/hooks";

interface UseHomeInteractionsReturn {
  /** Handle successful curation action */
  handleCurateSuccess: () => void;
  /** Handle refresh action */
  handleRefresh: () => void;
}

export function useHomeInteractions(): UseHomeInteractionsReturn {
  const { loadCurates, checkForNewCurates } = useCurateData();

  const handleCurateSuccess = useCallback(() => {
    // Trigger immediate check for new curates after successful curation
    setTimeout(() => {
      checkForNewCurates();
    }, 5000); // Wait 5 seconds for blockchain/subgraph to update
  }, [checkForNewCurates]);

  const handleRefresh = useCallback(() => {
    loadCurates(false, true);
  }, [loadCurates]);

  return {
    handleCurateSuccess,
    handleRefresh,
  };
}