/**
 * Barrel exports for Home feature
 * 
 * @description Provides convenient access to all Home components and types
 * from a single import location.
 */

// Main component
export { Home } from './Home';

// Sub-components
export { CurateImage } from './CurateImage';
export { ImageDetail } from './ImageDetail';
export { SkeletonGrid } from './SkeletonGrid';

// Optimized components
export * from './components';

// Custom hooks
export * from './hooks';

// Types
export type { HomeProps, Curate, CurateImageProps, ImageDetailProps, FeaturesProps } from './Home.types';