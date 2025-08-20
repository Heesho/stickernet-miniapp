"use client";

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number | string;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  animateOnMount?: boolean;
}

export function AnimatedNumber({
  value,
  duration = 600,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
  animateOnMount = false
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValueRef = useRef<number>(0);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const isMountedRef = useRef(false);

  useEffect(() => {
    const targetNum = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(targetNum)) {
      setDisplayValue(String(value));
      return;
    }

    // Skip animation on mount if not requested
    if (!isMountedRef.current && !animateOnMount) {
      isMountedRef.current = true;
      previousValueRef.current = targetNum;
      setDisplayValue(targetNum.toFixed(decimals));
      return;
    }

    // Skip animation if value hasn't changed
    if (targetNum === previousValueRef.current) {
      return;
    }

    const startValue = previousValueRef.current;
    const endValue = targetNum;
    
    // Add a subtle flash effect for price changes
    if (isMountedRef.current) {
      setIsAnimating(true);
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * eased;
      
      // Format based on the value magnitude
      let formatted: string;
      if (Math.abs(currentValue) >= 1000000) {
        formatted = (currentValue / 1000000).toFixed(2) + 'M';
      } else if (Math.abs(currentValue) >= 1000) {
        formatted = (currentValue / 1000).toFixed(2) + 'K';
      } else if (Math.abs(currentValue) < 1 && currentValue !== 0) {
        formatted = currentValue.toFixed(Math.max(decimals, 6));
      } else {
        formatted = currentValue.toFixed(decimals);
      }
      
      setDisplayValue(formatted);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValueRef.current = endValue;
        startTimeRef.current = 0;
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    isMountedRef.current = true;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, decimals, animateOnMount]);

  // Determine color animation based on value change
  const getAnimationClass = () => {
    if (!isAnimating || !isMountedRef.current) return '';
    
    const currentVal = typeof value === 'string' ? parseFloat(value) : value;
    const isIncrease = currentVal > previousValueRef.current;
    
    return isIncrease 
      ? 'animate-price-increase text-[#0052FF]' 
      : 'animate-price-decrease text-[#FF6B35]';
  };

  return (
    <span className={`transition-colors duration-300 ${className} ${getAnimationClass()}`}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}