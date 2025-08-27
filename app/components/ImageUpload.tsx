'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { getIPFSUrl } from '@/lib/pinata';

interface ImageUploadProps {
  onUploadComplete: (ipfsHash: string) => void;
  currentImage?: string;
  className?: string;
  accept?: string;
  maxSizeMB?: number;
}

export default function ImageUpload({
  onUploadComplete,
  currentImage,
  className = '',
  accept = 'image/*,video/*',
  maxSizeMB = 100
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(currentImage || '');
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setError('');
    setUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      const ipfsUrl = getIPFSUrl(data.ipfsHash);
      setPreview(ipfsUrl);
      onUploadComplete(data.ipfsHash);
      setUploadProgress(100);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setPreview('');
    } finally {
      setUploading(false);
    }
  }, [maxSizeMB, onUploadComplete]);

  return (
    <div className={`relative ${className}`}>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        {preview ? (
          <div className="relative">
            {preview.includes('video') ? (
              <video
                src={preview}
                controls
                className="max-w-full h-auto mx-auto rounded-lg"
                style={{ maxHeight: '300px' }}
              />
            ) : (
              <Image
                src={preview}
                alt="Upload preview"
                width={300}
                height={300}
                className="max-w-full h-auto mx-auto rounded-lg object-cover"
              />
            )}
            <button
              onClick={() => {
                setPreview('');
                setError('');
              }}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {accept === 'image/*' ? 'PNG, JPG, GIF' : 'Images and Videos'} up to {maxSizeMB}MB
            </p>
          </div>
        )}

        <input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>

      {uploading && (
        <div className="mt-2">
          <div className="bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">Uploading to IPFS...</p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}