'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchBoardMetadata } from '@/lib/utils/metadata';
import { getIPFSUrl } from '@/lib/pinata';

interface TokenImageProps {
  uri: string;
  name: string;
  size?: number;
  className?: string;
  onError?: () => void;
  priority?: boolean;
}

export function TokenImage({ uri, name, size = 40, className = '', onError, priority = false }: TokenImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        // Try to fetch as metadata first
        const metadata = await fetchBoardMetadata(uri);
        if (metadata?.image) {
          // It's metadata with an image field
          setImageUrl(getIPFSUrl(metadata.image));
        } else {
          // It's likely a direct image URL
          setImageUrl(getIPFSUrl(uri));
        }
      } catch (err) {
        // If fetching as metadata fails, assume it's a direct image URL
        setImageUrl(getIPFSUrl(uri));
      } finally {
        setLoading(false);
      }
    };

    if (uri) {
      loadImage();
    }
  }, [uri]);

  const handleError = () => {
    setError(true);
    setImageLoaded(false);
    if (onError) onError();
  };

  if (error) {
    // Fallback for errored images
    return (
      <div 
        className={`bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-gray-400">
          {name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {(loading || !imageLoaded) && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse rounded" />
      )}
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={name}
          width={size}
          height={size}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={handleError}
          priority={priority}
        />
      )}
    </div>
  );
}