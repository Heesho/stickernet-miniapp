/**
 * Loading Components Index
 * 
 * Centralized exports for all loading-related components and utilities.
 */

// Core loading components
export { LoadingSkeleton, TextSkeleton, CardSkeleton, ListItemSkeleton, TableRowSkeleton, FormSkeleton } from './LoadingSkeleton';
export type { LoadingSkeletonProps, SkeletonVariant, SkeletonAnimation, SkeletonSize } from './LoadingSkeleton';

export { 
  EnhancedLoadingSpinner, 
  PageLoadingSpinner, 
  ButtonLoadingSpinner, 
  FormLoadingSpinner, 
  ProgressSpinner 
} from './LoadingSpinner.enhanced';
export type { EnhancedSpinnerProps, SpinnerVariant, SpinnerAnimation } from './LoadingSpinner.enhanced';

export { 
  LoadingOverlay, 
  PageLoadingOverlay, 
  ComponentLoadingOverlay, 
  GlobalLoadingOverlay,
  useLoadingOverlay 
} from './LoadingOverlay';
export type { LoadingOverlayProps, OverlaySize, OverlayPosition } from './LoadingOverlay';

// Legacy components (for backward compatibility)
export { LoadingSpinner } from '../LoadingSpinner/LoadingSpinner';
export type { LoadingSpinnerProps } from '../LoadingSpinner/LoadingSpinner.types';

// State management
export { useLoadingState, useSimpleLoadingState, useGlobalLoadingState } from '../../../hooks/useLoadingState';
export type { 
  UseLoadingStateConfig, 
  UseLoadingStateReturn, 
  LoadingOperation, 
  LoadingState, 
  LoadingPriority,
  LoadingOperationMeta,
  ActiveLoadingOperation 
} from '../../../hooks/useLoadingState';

// Context
export { LoadingProvider, useGlobalLoading, useComponentLoading } from '../../../contexts/LoadingContext';

// Utility components for common patterns
export { 
  LoadingButton, 
  SubmitButton, 
  AsyncButton, 
  UploadButton 
} from './LoadingButton';
export type { LoadingButtonProps, AsyncButtonProps, UploadButtonProps } from './LoadingButton';

export { 
  LoadingCard, 
  ImageCard 
} from './LoadingCard';
export type { LoadingCardProps, ImageCardProps, CardLoadingState } from './LoadingCard';

export { 
  LoadingTable, 
  DataTable, 
  TableRow, 
  TableCell 
} from './LoadingTable';
export type { LoadingTableProps, DataTableProps } from './LoadingTable';

export { 
  LoadingList, 
  DataList, 
  LoadingListItem, 
  ListItem 
} from './LoadingList';
export type { LoadingListProps, DataListProps, LoadingListItemProps, ListItemProps } from './LoadingList';

export { 
  LoadingForm, 
  LoadingFormField, 
  LoadingInput 
} from './LoadingForm';
export type { LoadingFormProps, LoadingFormFieldProps, LoadingInputProps } from './LoadingForm';

export { 
  LoadingPage, 
  AppLoadingPage, 
  PageTransitionLoading 
} from './LoadingPage';
export type { LoadingPageProps, PageLoadingLayout } from './LoadingPage';