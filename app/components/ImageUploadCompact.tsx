'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { getIPFSUrl } from '@/lib/pinata';

interface ImageUploadCompactProps {
  onUploadComplete: (ipfsHash: string) => void;
  currentImage?: string;
  className?: string;
  size?: number;
  fullScreenPreview?: boolean;
}

export default function ImageUploadCompact({
  onUploadComplete,
  currentImage,
  className = '',
  size = 128,
  fullScreenPreview = false
}: ImageUploadCompactProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(currentImage || '');
  const [error, setError] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      setError(`File size must be less than 100MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return;
    }

    setError('');
    setUploading(true);
    setImageLoaded(false); // Reset image loaded state

    // Create preview
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.onerror = () => {
        console.error('Error reading file for preview');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error creating preview:', err);
    }

    try {
      const formData = new FormData();
      
      // For iOS, ensure the file is properly attached
      // Some iOS browsers might need special handling
      if (file.type === '' && file.name.toLowerCase().endsWith('.heic')) {
        // HEIC files might not have a proper MIME type
        const blob = new Blob([file], { type: 'image/heic' });
        formData.append('file', blob, file.name);
      } else {
        formData.append('file', file);
      }

      console.log('Uploading file to server...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.text();
      let data;
      try {
        data = JSON.parse(responseData);
      } catch (parseErr) {
        console.error('Failed to parse response:', responseData);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        console.error('Upload failed:', data);
        throw new Error(data.error || `Upload failed with status ${response.status}`);
      }

      console.log('Upload successful:', data);
      const ipfsUrl = getIPFSUrl(data.ipfsHash);
      setPreview(ipfsUrl);
      onUploadComplete(data.ipfsHash);
    } catch (err) {
      console.error('Upload error details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      setPreview('');
      // Reset file input to allow re-selection
      if (e.target) {
        e.target.value = '';
      }
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  // Full height preview for sticker page (with or without uploading)
  if (fullScreenPreview && preview) {
    return (
      <div className="w-full flex-1 overflow-y-auto overflow-x-hidden">
        {/* Show loader while uploading or image loading */}
        {(uploading || !imageLoaded) && (
          <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
            <div className="w-12 h-12 border-3 border-gray-400 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
        
        <Image
          src={preview}
          alt="Preview"
          width={500}
          height={500}
          className="w-full h-auto object-contain"
          priority
          onLoad={() => setImageLoaded(true)}
          style={{ opacity: imageLoaded && !uploading ? 1 : 0 }}
        />
        {/* Add padding at bottom to ensure scrolling and visibility above Stick button */}
        <div className="h-48 bg-black" />
      </div>
    );
  }

  // For non-fullscreen mode or when no preview
  if (!fullScreenPreview) {
    return (
      <div 
        className={`relative flex-shrink-0 ${className}`} 
        style={{ width: size, height: size }}
      >
        {preview ? (
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ) : (
        <div className="w-full h-full border-2 border-dashed border-gray-600 rounded-2xl flex items-center justify-center hover:border-gray-400 transition-colors cursor-pointer">
          {uploading ? (
            <div className="w-8 h-8 border-3 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="relative">
              <svg
                className="w-10 h-10 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">+</span>
              </div>
            </div>
            )}
          </div>
        )}
        
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        {error && (
          <div className="absolute -bottom-6 left-0 text-xs text-red-500">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Default upload box for fullScreenPreview mode when no preview
  return (
    <div 
      className={`relative flex-shrink-0 ${className}`} 
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full border-2 border-dashed border-gray-600 rounded-2xl flex items-center justify-center hover:border-gray-400 transition-colors cursor-pointer">
        {uploading ? (
          <div className="w-8 h-8 border-3 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className="relative">
            <svg
              className="w-10 h-10 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
              <span className="text-black text-xs font-bold">+</span>
            </div>
          </div>
        )}
      </div>
      
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />

      {error && (
        <div className="absolute -bottom-6 left-0 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}