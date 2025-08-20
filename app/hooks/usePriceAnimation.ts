import { useEffect, useRef, useState, useCallback } from 'react';

interface PriceChangeEvent {
  tokenAddress: string;
  previousPrice: string;
  newPrice: string;
  direction: 'up' | 'down';
}

interface UsePriceAnimationReturn {
  animationClass: string;
  isAnimating: boolean;
  priceDirection: 'up' | 'down' | 'neutral';
  percentageChange: number;
  triggerAnimation: (direction?: 'up' | 'down') => void;
}

export function usePriceAnimation(
  currentPrice: string | undefined,
  tokenAddress?: string
): UsePriceAnimationReturn {
  const [animationClass, setAnimationClass] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [percentageChange, setPercentageChange] = useState(0);
  const previousPriceRef = useRef<string>();
  const animationTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate percentage change
  const calculatePercentageChange = useCallback((oldPrice: string, newPrice: string) => {
    const old = parseFloat(oldPrice);
    const current = parseFloat(newPrice);
    if (old === 0) return 0;
    return ((current - old) / old) * 100;
  }, []);

  // Trigger animation manually
  const triggerAnimation = useCallback((direction: 'up' | 'down' = 'up') => {
    // Clear any existing animation
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Set animation classes based on direction
    const animClass = direction === 'up' 
      ? 'animate-price-increase' 
      : 'animate-price-decrease';
    
    setAnimationClass(animClass);
    setIsAnimating(true);
    setPriceDirection(direction);

    // Clear animation after duration
    animationTimeoutRef.current = setTimeout(() => {
      setAnimationClass('');
      setIsAnimating(false);
    }, 1000);
  }, []);

  // Listen for price change events
  useEffect(() => {
    if (!tokenAddress) return;

    const handlePriceChange = (event: CustomEvent<PriceChangeEvent>) => {
      if (event.detail.tokenAddress === tokenAddress) {
        const change = calculatePercentageChange(
          event.detail.previousPrice,
          event.detail.newPrice
        );
        setPercentageChange(change);
        triggerAnimation(event.detail.direction);
      }
    };

    window.addEventListener('priceChanged', handlePriceChange as EventListener);
    return () => {
      window.removeEventListener('priceChanged', handlePriceChange as EventListener);
    };
  }, [tokenAddress, calculatePercentageChange, triggerAnimation]);

  // Detect price changes
  useEffect(() => {
    if (!currentPrice || !previousPriceRef.current) {
      previousPriceRef.current = currentPrice;
      return;
    }

    if (previousPriceRef.current !== currentPrice) {
      const change = calculatePercentageChange(previousPriceRef.current, currentPrice);
      setPercentageChange(change);
      
      const direction = parseFloat(currentPrice) > parseFloat(previousPriceRef.current) 
        ? 'up' 
        : 'down';
      
      triggerAnimation(direction);
      previousPriceRef.current = currentPrice;
    }
  }, [currentPrice, calculatePercentageChange, triggerAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return {
    animationClass,
    isAnimating,
    priceDirection,
    percentageChange,
    triggerAnimation
  };
}

// Hook for number ticker animation
export function useNumberTicker(
  value: string | number,
  duration: number = 1000
): {
  displayValue: string;
  isAnimating: boolean;
} {
  const [displayValue, setDisplayValue] = useState(String(value));
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();
  const startValueRef = useRef<number>(0);
  const targetValueRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const targetNum = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(targetNum) || targetNum === targetValueRef.current) {
      setDisplayValue(String(value));
      return;
    }

    // Start animation
    startValueRef.current = targetValueRef.current || 0;
    targetValueRef.current = targetNum;
    startTimeRef.current = Date.now();
    setIsAnimating(true);

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValueRef.current + 
        (targetValueRef.current - startValueRef.current) * eased;
      
      // Format based on magnitude
      const decimals = Math.abs(currentValue) < 1 ? 6 : 
                      Math.abs(currentValue) < 100 ? 4 : 2;
      setDisplayValue(currentValue.toFixed(decimals));
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setDisplayValue(String(value));
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return { displayValue, isAnimating };
}