export type CreateProps = {
  setActiveTab?: (tab: string) => void;
};

export interface StickerFormData {
  name: string;
  description: string;
  tags: string[];
  file: File | null;
}

export interface FileUploadState {
  isDragOver: boolean;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  uploadSuccess: boolean;
  previewUrl: string | null;
}

export interface FormValidation {
  name: boolean;
  description: boolean;
  file: boolean;
  tags: boolean;
}

export interface UploadResultState {
  transactionHash?: string;
  tokenId?: string;
  imageUrl?: string;
  error?: string;
}

export type FileUploadProps = {
  onFileSelect: (file: File) => void;
  isDragOver: boolean;
  onDragOver: (isDragOver: boolean) => void;
  disabled?: boolean;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
};

export type ImagePreviewProps = {
  previewUrl: string;
  fileName: string;
  onRemove: () => void;
};

export type StickerFormProps = {
  formData: StickerFormData;
  onFormDataChange: (data: StickerFormData) => void;
  validation: FormValidation;
  disabled?: boolean;
};

export type UploadProgressProps = {
  progress: number;
  isUploading: boolean;
  error: string | null;
  onRetry?: () => void;
};

export type UploadSuccessProps = {
  result: UploadResultState;
  onCreateAnother: () => void;
  onViewSticker?: () => void;
};

// Constants
export const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_TAG_LENGTH = 20;
export const MAX_TAGS_COUNT = 10;
export const MAX_NAME_LENGTH = 50;
export const MAX_DESCRIPTION_LENGTH = 500;