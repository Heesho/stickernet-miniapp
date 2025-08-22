/**
 * VirtualizedGrid component for Home feed
 * 
 * @description Renders curate items in a virtualized masonry grid for optimal performance.
 * Uses virtual scrolling for large lists and proper memoization.
 */

"use client";

import { memo, useMemo } from "react";
import { CurateImage } from "../CurateImage";
import { useVirtualScrolling } from "../hooks";
import type { Curate } from "@/lib/constants";

interface VirtualizedGridProps {
  /** Array of curate items to display */
  curates: Curate[];
  /** Set of new item IDs for animation */
  newItems: Set<string>;
  /** Handler for image click events */
  onImageClick: (curate: Curate) => void;
  /** Enable virtual scrolling */
  enableVirtualScrolling?: boolean;
}

export const VirtualizedGrid = memo(function VirtualizedGrid({
  curates,
  newItems,
  onImageClick,
  enableVirtualScrolling = true,
}: VirtualizedGridProps) {
  const {
    visibleItems,
    totalHeight,
    offsetY,
    isVirtual,
  } = useVirtualScrolling({
    itemCount: curates.length,
    containerHeight: 800,
    bufferSize: 5,
    enabled: enableVirtualScrolling,
  });

  // Memoize visible curates to prevent unnecessary re-renders
  const visibleCurates = useMemo(() => {
    if (!isVirtual) {
      return curates.map((curate, index) => ({ curate, index }));
    }
    
    return visibleItems.map(index => ({
      curate: curates[index],
      index,
    }));
  }, [curates, visibleItems, isVirtual]);

  if (isVirtual) {
    return (
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
          }}
          className="columns-2 gap-4"
        >
          {visibleCurates.map(({ curate, index }) => (
            <CurateImage
              key={curate.id}
              curate={curate}
              index={index}
              onImageClick={() => onImageClick(curate)}
              isNew={newItems.has(curate.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="columns-2 gap-4">
      {visibleCurates.map(({ curate, index }) => (
        <CurateImage
          key={curate.id}
          curate={curate}
          index={index}
          onImageClick={() => onImageClick(curate)}
          isNew={newItems.has(curate.id)}
        />
      ))}
    </div>
  );
});