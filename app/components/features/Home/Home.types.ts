/**
 * Type definitions for Home feature components
 *
 * @description Contains all TypeScript interfaces and types used
 * throughout the Home feature components.
 */

// Import Curate type for local use
import type { Curate } from "@/types";

/**
 * Props for the main Home component
 */
export interface HomeProps {
  /** Function to set the active tab */
  setActiveTab?: (tab: string) => void;
  /** Function to navigate to board view */
  onNavigateToBoard?: (tokenId: string, tokenAddress: string) => void;
}

/**
 * Props for the CurateImage component
 */
export interface CurateImageProps {
  /** The curate data to display */
  curate: Curate;
  /** Index in the grid for optimization */
  index: number;
  /** Handler for image click events */
  onImageClick: () => void;
  /** Whether this is a newly added item for animation */
  isNew?: boolean;
}

/**
 * Props for the ImageDetail modal component
 */
export interface ImageDetailProps {
  /** The curate data to display in detail */
  curate: Curate;
  /** Handler to close the modal */
  onClose: () => void;
  /** Handler for curation action */
  onCurate: () => void;
  /** Optional handler to navigate to board */
  onNavigateToBoard?: (tokenId: string, tokenAddress: string) => void;
  /** Optional callback when steal confirmation state changes */
  onStealConfirmationChange?: (showing: boolean) => void;
}

/**
 * Props for navigation-related components
 */
export interface NavigationProps {
  /** Function to set the active tab */
  setActiveTab: (tab: string) => void;
}

/**
 * Props for Features component
 */
export interface FeaturesProps extends NavigationProps {}

/**
 * Common loading state interface
 */
export interface LoadingState {
  /** Whether initial load is in progress */
  loading: boolean;
  /** Whether additional content is loading */
  loadingMore: boolean;
  /** Whether refresh operation is in progress */
  refreshing: boolean;
}

/**
 * Common error state interface
 */
export interface ErrorState {
  /** Error message if any */
  error: string | null;
  /** Whether component is in error state */
  hasError: boolean;
}
