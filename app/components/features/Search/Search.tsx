"use client";

import { useState, useCallback, useEffect, useRef, useMemo, memo } from "react";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button, Icon } from "../../ui";
import { TokenImage } from "../../ui/TokenImage";
import { 
  executeGraphQLQuery,
  fetchTokens,
  fetchTrendingTokens,
  type TokenEntity,
  type GraphQLResponse
} from "@/lib/api/subgraph";
import type { SearchProps, SearchState } from "./Search.types";

interface ExtendedSearchState extends SearchState {
  tokens: TokenEntity[];
  activeTab: 'top' | 'trending' | 'new';
  loadingTokens: boolean;
}

function formatPrice(price: string | undefined): string {
  if (!price) return '$0.00';
  const numPrice = parseFloat(price);
  if (numPrice < 0.01) return `$${numPrice.toFixed(6)}`;
  if (numPrice < 1) return `$${numPrice.toFixed(4)}`;
  if (numPrice < 100) return `$${numPrice.toFixed(2)}`;
  return `$${numPrice.toFixed(0)}`;
}

function formatMarketCap(marketCap: string | undefined): string {
  if (!marketCap) return '$0';
  const num = parseFloat(marketCap);
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

const TokenListItem = memo(function TokenListItem({ 
  token, 
  rank,
  onClick 
}: { 
  token: TokenEntity; 
  rank: number;
  onClick?: () => void;
}) {
  return (
    <div 
      className="flex items-center space-x-3 py-2 px-1 hover:bg-[var(--app-hover)] transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      {/* Rank */}
      <div className="text-[var(--app-foreground-muted)] font-mono text-sm w-8 text-center">
        {rank}
      </div>

      {/* Token Image */}
      <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-900">
        <TokenImage 
          uri={token.uri}
          name={token.name}
          size={40}
          className="w-full h-full rounded-full"
        />
      </div>

      {/* Token Info - Symbol and Name stacked */}
      <div className="flex-1 min-w-0">
        <div className="text-lg font-semibold text-white truncate">
          {token.symbol || '???'}
        </div>
        <div className="text-sm text-gray-500 truncate">
          {token.name || 'Unknown'}
        </div>
      </div>

      {/* Price and Holders */}
      <div className="text-right">
        <div className="font-medium text-[var(--app-foreground)]">
          {formatPrice(token.marketPrice)}
        </div>
        <div className="flex items-center justify-end space-x-1 text-xs text-[var(--app-foreground-muted)]">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
          </svg>
          <span>{token.holders || '0'}</span>
        </div>
      </div>
    </div>
  );
});

export function Search({}: SearchProps) {
  const router = useRouter();
  const [searchState, setSearchState] = useState<ExtendedSearchState>({
    query: '',
    results: [],
    loading: false,
    error: null,
    hasSearched: false,
    tokens: [],
    activeTab: 'top',
    loadingTokens: true,
  });
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load tokens on mount
  useEffect(() => {
    loadTokens('top');
  }, []);

  // Load tokens based on tab
  const loadTokens = useCallback(async (tab: 'top' | 'trending' | 'new') => {
    setSearchState(prev => ({
      ...prev,
      loadingTokens: true,
      activeTab: tab,
      error: null,
    }));

    try {
      let tokens: TokenEntity[] = [];

      if (tab === 'trending') {
        // Use 24h volume data for trending
        tokens = await fetchTrendingTokens(50, 0);
      } else if (tab === 'new') {
        // Sort by creation timestamp for new tokens
        tokens = await fetchTokens(50, 0, 'createdAtTimestamp', 'desc');
      } else {
        // Default to top by market cap
        tokens = await fetchTokens(50, 0, 'marketCap', 'desc');
      }
      
      setSearchState(prev => ({
        ...prev,
        tokens,
        loadingTokens: false,
      }));
    } catch (error) {
      console.error('Failed to load tokens:', error);
      setSearchState(prev => ({
        ...prev,
        tokens: [],
        loadingTokens: false,
        error: 'Failed to load tokens. Please try again.',
      }));
    }
  }, []);

  // Memoize expensive filtering operation
  const filteredTokens = useMemo(() => {
    const query = searchState.query.trim().toLowerCase();
    return query 
      ? searchState.tokens.filter(token => 
          token.name?.toLowerCase().includes(query) ||
          token.symbol?.toLowerCase().includes(query)
        )
      : searchState.tokens;
  }, [searchState.query, searchState.tokens]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchState(prev => ({ ...prev, query }));
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      query: '',
    }));
  }, []);

  // Handle tab change
  const handleTabChange = useCallback((tab: 'top' | 'trending' | 'new') => {
    if (tab !== searchState.activeTab) {
      loadTokens(tab);
    }
  }, [searchState.activeTab, loadTokens]);

  // Navigate to token page
  const handleTokenClick = useCallback((tokenId: string) => {
    router.push(`/b/${tokenId}`);
  }, [router]);

  return (
    <div className="animate-fade-in">
      {/* Sticky header with search and tabs */}
      <div className="sticky top-0 bg-black z-10 pb-4 -mx-4 px-4 pt-3 pwa-safe-top">
        {/* Search Input */}
        <div className="relative mb-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
            <Icon 
              name="search" 
              size="sm" 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--app-foreground-muted)]" 
            />
            <input
              type="text"
              placeholder="Search"
              value={searchState.query}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-3 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-2xl text-[var(--app-foreground)] placeholder-[var(--app-foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent"
            />
            {searchState.query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)] transition-colors"
              >
                <Icon name="close" size="sm" />
              </button>
            )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2">
        <button
          onClick={() => handleTabChange('top')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            searchState.activeTab === 'top'
              ? 'bg-[var(--app-accent)] text-white'
              : 'bg-[var(--app-card-bg)] text-[var(--app-foreground-muted)] hover:bg-[var(--app-hover)]'
          }`}
        >
          Top
        </button>
        <button
          onClick={() => handleTabChange('trending')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            searchState.activeTab === 'trending'
              ? 'bg-[var(--app-accent)] text-white'
              : 'bg-[var(--app-card-bg)] text-[var(--app-foreground-muted)] hover:bg-[var(--app-hover)]'
          }`}
        >
          Trending
        </button>
        <button
          onClick={() => handleTabChange('new')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            searchState.activeTab === 'new'
              ? 'bg-[var(--app-accent)] text-white'
              : 'bg-[var(--app-card-bg)] text-[var(--app-foreground-muted)] hover:bg-[var(--app-hover)]'
          }`}
        >
          New
        </button>
        </div>
      </div>

      {/* Token List */}
      <div className="space-y-2 pb-24">
        {searchState.loadingTokens ? (
          // Loading skeleton
          <>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 py-2 px-1 animate-pulse">
                <div className="w-8 h-8 bg-[var(--app-gray)] rounded" />
                <div className="w-10 h-10 bg-[var(--app-gray)] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-[var(--app-gray)] rounded w-1/4" />
                  <div className="h-3 bg-[var(--app-gray)] rounded w-1/3" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-[var(--app-gray)] rounded w-20" />
                  <div className="h-3 bg-[var(--app-gray)] rounded w-10" />
                </div>
              </div>
            ))}
          </>
        ) : searchState.error ? (
          <div className="text-center py-8">
            <Icon name="warning" size="lg" className="text-red-500 mx-auto mb-2" />
            <p className="text-[var(--app-foreground-muted)]">{searchState.error}</p>
            <Button
              onClick={() => loadTokens(searchState.activeTab)}
              className="mt-4"
              variant="secondary"
            >
              Try Again
            </Button>
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="search" size="lg" className="text-[var(--app-foreground-muted)] mx-auto mb-2" />
            <p className="text-[var(--app-foreground-muted)]">
              {searchState.query ? 'No tokens found matching your search' : 'No tokens available'}
            </p>
          </div>
        ) : (
          filteredTokens.map((token, index) => {
            // Memoize individual token click handlers
            const handleClick = () => handleTokenClick(token.id);
            
            return (
              <TokenListItem
                key={token.id}
                token={token}
                rank={index + 1}
                onClick={handleClick}
              />
            );
          })
        )}
      </div>
    </div>
  );
}