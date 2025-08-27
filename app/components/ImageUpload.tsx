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

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSizeMB}MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return;
    }

    setError('');
    setUploading(true);
    setUploadProgress(0);

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
      setUploadProgress(100);
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