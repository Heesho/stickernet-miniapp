import type { Curate } from "@/lib/constants";

// Re-export for convenience
export type { Curate };

export type HomeProps = {
  setActiveTab: (tab: string) => void;
  onNavigateToBoard?: (tokenId: string, tokenAddress: string) => void;
};

export type CurateImageProps = {
  curate: Curate;
  index: number;
  onImageClick: () => void;
  isNew?: boolean;
};

export type ImageDetailProps = {
  curate: Curate;
  onClose: () => void;
  onCurate: () => void;
  onNavigateToBoard?: (tokenId: string, tokenAddress: string) => void;
};

export type FeaturesProps = {
  setActiveTab: (tab: string) => void;
};