/**
 * Custom hook for managing Home component state
 * 
 * @description Centralizes state management for selected curate, modal visibility,
 * and other UI-related states with optimized updates.
 */

"use client";

import { useState, useCallback } from "react";
import type { Curate } from "@/lib/constants";

interface UseHomeStateReturn {
  /** Currently selected curate for modal display */
  selectedCurate: Curate | null;
  /** Show selected curate in modal */
  showCurate: (curate: Curate) => void;
  /** Close curate modal */
  closeCurate: () => void;
}

export function useHomeState(): UseHomeStateReturn {
  const [selectedCurate, setSelectedCurate] = useState<Curate | null>(null);

  const showCurate = useCallback((curate: Curate) => {
    setSelectedCurate(curate);
  }, []);

  const closeCurate = useCallback(() => {
    setSelectedCurate(null);
  }, []);

  return {
    selectedCurate,
    showCurate,
    closeCurate,
  };
}