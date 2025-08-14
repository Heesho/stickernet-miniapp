"use client";

import { useState } from "react";
import Image from 'next/image';
import { Icon } from "../../ui";
import type { CurateImageProps } from "./Home.types";

export function CurateImage({ curate, index, onImageClick, isNew }: CurateImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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
          <div className="relative">
            {!imageLoaded && (
              <div className="aspect-square bg-[var(--app-gray)] animate-pulse rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 bg-[var(--app-accent-light)] rounded-full"></div>
              </div>
            )}
            <Image
              src={curate.uri}
              alt={`Curate ${curate.id}`}
              width={300}
              height={300}
              className={`w-full object-cover rounded-2xl transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute top-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-square bg-[var(--app-gray)] rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <Icon name="profile" size="lg" className="text-[var(--app-foreground-muted)] mx-auto mb-2" />
              <p className="text-xs text-[var(--app-foreground-muted)]">Image not available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}