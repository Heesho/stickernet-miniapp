/**
 * Custom hook for polling data when page is visible
 * 
 * @description Manages polling intervals that pause when the page is hidden
 * and resume when visible, optimizing performance and API usage.
 */

"use client";

import { useEffect, useRef, useCallback } from 'react';

interface UseVisibilityPollingProps {
  /** Function to call on each poll */
  onPoll: () => void;
  /** Polling interval in milliseconds */
  interval: number;
  /** Whether polling should be active */
  enabled: boolean;
  /** Additional condition to check before polling */
  shouldPoll?: () => boolean;
}

/**
 * Hook for visibility-aware polling
 * 
 * @param props Configuration for polling behavior
 * @returns Void - manages polling automatically
 */
export function useVisibilityPolling({
  onPoll,
  interval,
  enabled,
  shouldPoll = () => true
}: UseVisibilityPollingProps): void {
  const pollingIntervalRef = useRef<NodeJS.Timeout>();

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      if (!document.hidden && shouldPoll()) {
        onPoll();
      }
    }, interval);
  }, [onPoll, interval, shouldPoll]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = undefined;
    }
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      stopPolling();
    } else {
      if (enabled) {
        startPolling();
        // Check immediately when tab becomes visible
        if (shouldPoll()) {
          setTimeout(onPoll, 1000);
        }
      }
    }
  }, [enabled, startPolling, stopPolling, onPoll, shouldPoll]);

  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }

    // Start polling when enabled
    startPolling();

    // Handle visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, startPolling, stopPolling, handleVisibilityChange]);
}