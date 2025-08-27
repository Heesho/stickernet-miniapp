'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getIPFSUrl } from '@/lib/pinata';

interface IPFSImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

export default function IPFSImage({ 
  src, 
  alt, 
  className, 
  onLoad,
  onError,
  ...props 
}: IPFSImageProps) {
  const [imageSrc, setImageSrc] = useState(() => {
    // Handle IPFS URLs
    if (src?.startsWith('ipfs://') || src?.startsWith('Qm') || src?.includes('/ipfs/')) {
      return getIPFSUrl(src);
    }
    return src || '';
  });

  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (!src || hasError) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-xs">No image</span>
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={onLoad}
      {...props}
    />
  );
}