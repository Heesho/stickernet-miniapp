"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from 'next/image';
import { Button, Icon } from "../../ui";
import { ImageDetail } from "../Home/ImageDetail";
import { 
  executeGraphQLQuery,
  transformCurateEntities,
  SKELETON_HEIGHTS,
  type Curate,
  type CurateEntity,
  type GraphQLResponse
} from "@/lib/constants";
import type { SearchProps, SearchState } from "./Search.types";

// GraphQL query for search functionality
const SEARCH_CURATES_QUERY = `
  query SearchCurates($searchTerm: String!, $first: Int) {
    curates(
      first: $first
      orderBy: timestamp
      orderDirection: desc
      where: {
        or: [
          { token_: { name_contains_nocase: $searchTerm } }
          { creator_: { id_contains: $searchTerm } }
          { user_: { id_contains: $searchTerm } }
        ]
      }
    ) {
      id
      tokenId
      uri
      timestamp
      price
      creator {
        id
      }
      user {
        id
      }
      token {
        id
        name
        uri
      }
    }
  }
`;

interface SearchCuratesResponse {
  curates: CurateEntity[];
}

interface SearchCuratesVariables {
  searchTerm: string;
  first?: number;
}

// Search Image Component (similar to CurateImage)
function SearchImageResult({ curate, onImageClick }: { curate: Curate; onImageClick: () => void }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="mb-4 break-inside-avoid">
      <div 
        className="bg-[var(--app-card-bg)] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
        onClick={onImageClick}
      >
        {!imageError ? (
          <div className="relative">
            {!imageLoaded && (
              <div className="aspect-square bg-[var(--app-gray)] animate-pulse rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 bg-[var(--app-accent-light)] rounded-full"></div>
              </div>
            )}
            <Image
              src={curate.uri}
              alt={`Search result ${curate.id}`}
              width={300}
              height={300}
              className={`w-full object-cover rounded-2xl transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute top-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
            {/* Search result indicator */}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {curate.token.name || 'Curate'}
            </div>
          </div>
        ) : (
          <div className="aspect-square bg-[var(--app-gray)] rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <Icon name="search" size="lg" className="text-[var(--app-foreground-muted)] mx-auto mb-2" />
              <p className="text-xs text-[var(--app-foreground-muted)]">Image not available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Search function
async function searchCurates(searchTerm: string): Promise<Curate[]> {
  if (!searchTerm.trim()) {
    return [];
  }

  try {
    const result = await executeGraphQLQuery<SearchCuratesResponse, SearchCuratesVariables>(
      SEARCH_CURATES_QUERY,
      { searchTerm: searchTerm.trim(), first: 50 }
    );
    
    console.log('Search results found:', result.data?.curates?.length || 0);
    
    const entities = result.data?.curates || [];
    return transformCurateEntities(entities);
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

export function Search({}: SearchProps) {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    loading: false,
    error: null,
    hasSearched: false,
  });
  const [selectedCurate, setSelectedCurate] = useState<Curate | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(async (searchTerm: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setSearchState(prev => ({
          ...prev,
          results: [],
          loading: false,
          error: null,
          hasSearched: false,
        }));
        return;
      }

      setSearchState(prev => ({
        ...prev,
        loading: true,
        error: null,
        hasSearched: true,
      }));

      try {
        const results = await searchCurates(searchTerm);
        setSearchState(prev => ({
          ...prev,
          results,
          loading: false,
        }));
      } catch (error) {
        console.error('Search failed:', error);
        setSearchState(prev => ({
          ...prev,
          results: [],
          loading: false,
          error: 'Failed to search. Please try again.',
        }));
      }
    }, 500); // 500ms debounce delay
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchState(prev => ({ ...prev, query }));
    debouncedSearch(query);
  }, [debouncedSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchState({
      query: '',
      results: [],
      loading: false,
      error: null,
      hasSearched: false,
    });
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Loading skeleton
  if (searchState.loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Search Input */}
        <div className="relative">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Icon 
                name="profile" 
                size="sm" 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--app-foreground-muted)]" 
              />
              <input
                type="text"
                placeholder="Search stickernet"
                value={searchState.query}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-10 py-3 bg-[var(--app-card-bg)] rounded-2xl text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]"
              />
              {searchState.query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)] transition-colors"
                >
                  <Icon name="search" size="sm" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading Results */}
        <div className="columns-2 gap-4 space-y-4">
          {SKELETON_HEIGHTS.slice(0, 6).map((height, i) => (
            <div key={i} className="mb-4 break-inside-avoid">
              <div className="bg-[var(--app-card-bg)] rounded-2xl overflow-hidden">
                <div 
                  className="w-full bg-[var(--app-gray)] animate-pulse rounded-2xl"
                  style={{ height: `${height}px` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Icon 
              name="search" 
              size="sm" 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--app-foreground-muted)]" 
            />
            <input
              type="text"
              placeholder="Search stickernet"
              value={searchState.query}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-3 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-2xl text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent"
            />
            {searchState.query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)] transition-colors"
              >
                <Icon name="search" size="sm" />
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}