import type { Curate } from "@/types";

export type SearchProps = {
  setActiveTab?: (tab: string) => void;
};

export type SearchState = {
  query: string;
  results: Curate[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
};

export type SearchResultsProps = {
  results: Curate[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
  query: string;
  onImageClick: (curate: Curate) => void;
};
