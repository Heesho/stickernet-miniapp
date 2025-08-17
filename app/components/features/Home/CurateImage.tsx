/**
 * CurateImage component for displaying individual curated images
 * 
 * @description Displays a curated image with loading states, error handling,
 * and interactive hover effects in a masonry layout.
 */

"use client";

import { useState, useCallback } from "react";
import Image from 'next/image';
import { Icon, LoadingSpinner } from "../../ui";
import type { CurateImageProps } from "./Home.types";

/**
 * Individual curate image component
 * 
 * @param props Component props including curate data and handlers
 * @returns Curate image element
 */
export function CurateImage({ curate, index, onImageClick, isNew }: CurateImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  return (
    <div 
      className={`mb-4 break-inside-avoid transition-all duration-500 ease-out ${
        isNew ? 'animate-new-item' : ''
      }`}
    >
      <div 
        className="bg-[var(--app-card-bg)] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
        onClick={onImageClick}
      >
        {!imageError ? (
          <ImageContent
            curate={curate}
            imageLoaded={imageLoaded}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <ImageErrorState />
        )}
      </div>
    </div>
  );
}

/**
 * Image content sub-component
 */
interface ImageContentProps {
  curate: { id: string; uri: string };
  imageLoaded: boolean;
  onLoad: () => void;
  onError: () => void;
}

function ImageContent({ curate, imageLoaded, onLoad, onError }: ImageContentProps) {
  return (
    <div className="relative">
      {!imageLoaded && (
        <div className="aspect-square bg-[var(--app-gray)] animate-pulse rounded-2xl flex items-center justify-center">
          <LoadingSpinner
            size="md"
            variant="accent"
            aria-label="Loading image..."
          />
        </div>
      )}
      <Image
        src={curate.uri}
        alt={`Curate ${curate.id}`}
        width={300}
        height={300}
        className={`w-full object-cover rounded-2xl transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0 absolute top-0'
        }`}
        onLoad={onLoad}
        onError={onError}
        loading="lazy"
        priority={false}
      />
    </div>
  );
}

/**
 * Image error state sub-component
 */
function ImageErrorState() {
  return (
    <div className="aspect-square bg-[var(--app-gray)] rounded-2xl flex items-center justify-center">
      <div className="text-center">
        <Icon 
          name="warning" 
          size="lg" 
          className="text-[var(--app-foreground-muted)] mx-auto mb-2" 
        />
        <p className="text-xs text-[var(--app-foreground-muted)]">
          Image not available
        </p>
      </div>
    </div>
  );
}