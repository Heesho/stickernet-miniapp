/**
 * Custom hook for intersection observer functionality
 * 
 * @description Provides a reusable intersection observer hook for detecting
 * when elements enter or leave the viewport.
 */

"use client";

import { useEffect, useState, useCallback } from 'react';

interface UseIntersectionObserverProps {
  /** Threshold for intersection (0-1) */
  threshold?: number;
  /** Root margin for intersection */
  rootMargin?: string;
  /** Whether to create a target element automatically */
  createTarget?: boolean;
  /** Target element styles if creating automatically */
  targetStyles?: Partial<CSSStyleDeclaration>;
}

interface UseIntersectionObserverReturn {
  /** Whether target is intersecting */
  isIntersecting: boolean;
  /** Reference to attach to target element */
  targetRef: (node: HTMLElement | null) => void;
  /** Create and observe a temporary element */
  observeTemporaryElement: (parent: HTMLElement, styles?: Partial<CSSStyleDeclaration>) => () => void;
}

/**
 * Hook for intersection observer
 * 
 * @param props Configuration for intersection observer
 * @returns Object with intersection state and utilities
 */
export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  createTarget = false,
  targetStyles = {}
}: UseIntersectionObserverProps = {}): UseIntersectionObserverReturn {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const targetRef = useCallback((node: HTMLElement | null) => {
    setTargetElement(node);
  }, []);

  const observeTemporaryElement = useCallback((
    parent: HTMLElement, 
    styles: Partial<CSSStyleDeclaration> = {}
  ) => {
    const tempElement = document.createElement('div');
    
    // Apply default styles
    Object.assign(tempElement.style, {
      height: '1px',
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      pointerEvents: 'none',
      ...targetStyles,
      ...styles
    });
    
    parent.appendChild(tempElement);
    setTargetElement(tempElement);
    
    // Return cleanup function
    return () => {
      if (parent.contains(tempElement)) {
        parent.removeChild(tempElement);
      }
      setTargetElement(null);
    };
  }, []);

  useEffect(() => {
    if (!targetElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(targetElement);

    return () => {
      observer.disconnect();
    };
  }, [targetElement, threshold, rootMargin]);

  return {
    isIntersecting,
    targetRef,
    observeTemporaryElement
  };
}