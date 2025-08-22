/**
 * Custom hook for managing Home component navigation
 * 
 * @description Handles navigation logic for curate interactions, board navigation,
 * and route management with memoized callbacks.
 */

"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Curate } from "@/lib/constants";

interface UseHomeNavigationReturn {
  /** Navigate to individual sticker page */
  navigateToSticker: (curate: Curate) => void;
  /** Navigate to board/token page */
  navigateToBoard: (tokenId: string, tokenAddress: string) => void;
}

export function useHomeNavigation(): UseHomeNavigationReturn {
  const router = useRouter();

  const navigateToSticker = useCallback((curate: Curate) => {
    // Navigate to sticker page with cleaner URL structure
    router.push(`/b/${curate.token.id}/${curate.tokenId}`);
  }, [router]);

  const navigateToBoard = useCallback((tokenId: string, tokenAddress: string) => {
    router.push(`/b/${tokenAddress}`);
  }, [router]);

  return {
    navigateToSticker,
    navigateToBoard,
  };
}