"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button, Icon } from "../../ui";
import { CurateImage } from "./CurateImage";
import { ImageDetail } from "./ImageDetail";
import { 
  fetchCurates,
  MOCK_CURATES,
  SKELETON_HEIGHTS,
  DEFAULT_FIRST,
  LOAD_MORE_LIMIT,
  INFINITE_SCROLL_THRESHOLD,
  type Curate
} from "@/lib/constants";
import type { HomeProps } from "./Home.types";

export function Home({ onNavigateToBoard }: HomeProps) {
  const [curates, setCurates] = useState<Curate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [selectedCurate, setSelectedCurate] = useState<Curate | null>(null);
  const [newItems, setNewItems] = useState<Set<string>>(new Set());
  const [isNearTop, setIsNearTop] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const lastTimestampRef = useRef<string>('');

  const loadCurates = useCallback(async (isInitialLoad = false, isRefresh = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      if (isRefresh) setRefreshing(true);
      
      // Try to fetch real data first
      try {
        const data = await fetchCurates(DEFAULT_FIRST, 0);
        setCurates(data);
        setError(null);
        setUseMockData(false);
        setHasMore(data.length >= DEFAULT_FIRST);
        setCurrentPage(1);
        
        // Update last timestamp for polling
        if (data.length > 0) {
          lastTimestampRef.current = data[0].timestamp;
        }
      } catch (fetchError) {
        console.error('Failed to fetch data:', fetchError);
        
        // Check if it's a rate limit error
        const isRateLimit = fetchError instanceof Error && fetchError.message.includes('Rate limit exceeded');
        const isIndexing = fetchError instanceof Error && fetchError.message.includes('currently being indexed');
        
        if (isRateLimit) {
          setError('API rate limit exceeded. Please wait a few minutes and refresh.');
        } else if (isIndexing) {
          setError('The subgraph is currently being indexed. Please wait a few minutes and refresh.');
        } else {
          setError('Unable to fetch content from the API');
        }
        
        setCurates([]);
        setUseMockData(false);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading curates:', err);
      if (isInitialLoad) {
        setError('Failed to load content');
      }
    } finally {
      if (isInitialLoad) setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  const loadMoreCurates = useCallback(async () => {
    if (loadingMore || !hasMore || useMockData) return;
    
    try {
      setLoadingMore(true);
      const data = await fetchCurates(LOAD_MORE_LIMIT, currentPage * LOAD_MORE_LIMIT);
      
      if (data.length > 0) {
        setCurates(prevCurates => {
          const existingIds = new Set(prevCurates.map(c => c.id));
          const newCurations = data.filter(c => !existingIds.has(c.id));
          return [...prevCurates, ...newCurations];
        });
        setCurrentPage(prev => prev + 1);
        setHasMore(data.length >= LOAD_MORE_LIMIT);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more curates:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, loadingMore, hasMore, useMockData]);

  // Check for new curates
  const checkForNewCurates = useCallback(async () => {
    if (useMockData || !lastTimestampRef.current) return;
    
    try {
      // Fetch only the most recent items
      const data = await fetchCurates(10, 0);
      
      if (data.length === 0) return;
      
      // Find new items by comparing timestamps
      const newestTimestamp = data[0].timestamp;
      const newCurates = data.filter(curate => 
        curate.timestamp > lastTimestampRef.current
      );
      
      if (newCurates.length > 0) {
        console.log(`Found ${newCurates.length} new curates`);
        
        // Add new items to the top of the feed
        setCurates(prevCurates => {
          const existingIds = new Set(prevCurates.map(c => c.id));
          const uniqueNewCurates = newCurates.filter(c => !existingIds.has(c.id));
          
          if (uniqueNewCurates.length > 0) {
            // Mark items as new for animation
            setNewItems(prev => {
              const newSet = new Set(prev);
              uniqueNewCurates.forEach(curate => newSet.add(curate.id));
              return newSet;
            });
            
            // Clear animation state after animation completes
            setTimeout(() => {
              setNewItems(prev => {
                const newSet = new Set(prev);
                uniqueNewCurates.forEach(curate => newSet.delete(curate.id));
                return newSet;
              });
            }, 1000);
            
            return [...uniqueNewCurates, ...prevCurates];
          }
          
          return prevCurates;
        });
        
        // Update last timestamp
        lastTimestampRef.current = newestTimestamp;
      }
    } catch (error) {
      console.error('Error checking for new curates:', error);
    }
  }, [useMockData]);

  useEffect(() => {
    // Initial load
    loadCurates(true);
  }, [loadCurates]);

  // Intersection Observer to detect if user is near top
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearTop(entry.isIntersecting);
      },
      { 
        threshold: 0.1,
        rootMargin: '100px 0px 0px 0px' // Trigger when within 100px of top
      }
    );

    // Create a target element at the top of the feed
    const targetElement = document.createElement('div');
    targetElement.style.height = '1px';
    targetElement.style.position = 'absolute';
    targetElement.style.top = '0';
    targetElement.style.left = '0';
    targetElement.style.width = '100%';
    targetElement.style.pointerEvents = 'none';
    
    document.body.appendChild(targetElement);
    observer.observe(targetElement);

    return () => {
      observer.disconnect();
      if (document.body.contains(targetElement)) {
        document.body.removeChild(targetElement);
      }
    };
  }, []);

  // Set up polling for new curates
  useEffect(() => {
    if (useMockData) return;

    const startPolling = () => {
      pollingIntervalRef.current = setInterval(() => {
        // Only check for new curates if user is near top and tab is visible
        if (isNearTop && !document.hidden) {
          checkForNewCurates();
        }
      }, 15000); // Check every 15 seconds
    };

    const stopPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = undefined;
      }
    };

    // Start polling when component mounts
    startPolling();

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
        // Check immediately when tab becomes visible
        if (isNearTop) {
          setTimeout(checkForNewCurates, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [useMockData, isNearTop, checkForNewCurates]);

  // Handle scroll for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (scrollTop + windowHeight >= documentHeight - INFINITE_SCROLL_THRESHOLD) {
        loadMoreCurates();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreCurates]);

  // Pull to refresh handlers
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && !refreshing) {
        const currentY = e.touches[0].clientY;
        const distance = currentY - startY;
        
        if (distance > 0) {
          setPullDistance(Math.min(distance, 100));
          if (distance > 20) {
            e.preventDefault();
          }
        }
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 60 && !refreshing) {
        loadCurates(false, true);
      }
      setPullDistance(0);
      setStartY(0);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startY, pullDistance, refreshing, loadCurates]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="columns-2 gap-4 space-y-4">
          {SKELETON_HEIGHTS.map((height, i) => (
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

  if (error) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <Icon name="profile" size="lg" className="text-[var(--app-foreground-muted)] mx-auto mb-4" />
        <p className="text-[var(--app-foreground-muted)]">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (curates.length === 0) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <Icon name="profile" size="lg" className="text-[var(--app-foreground-muted)] mx-auto mb-4" />
        <p className="text-[var(--app-foreground-muted)]">No content available yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="fixed top-0 left-0 right-0 flex justify-center items-center bg-[var(--app-background)] z-40 transition-all duration-200"
          style={{ 
            height: `${Math.min(pullDistance, 80)}px`,
            transform: `translateY(-${80 - Math.min(pullDistance, 80)}px)` 
          }}
        >
          <div className={`transition-all duration-200 ${refreshing ? 'animate-spin' : ''}`}>
            {refreshing ? (
              <div className="w-6 h-6 border-2 border-[var(--app-accent)] border-t-transparent rounded-full animate-spin"></div>
            ) : pullDistance > 60 ? (
              <div className="text-[var(--app-accent)] text-sm font-medium">Release to refresh</div>
            ) : (
              <div className="text-[var(--app-foreground-muted)] text-sm">Pull down to refresh</div>
            )}
          </div>
        </div>
      )}

      <div className="animate-fade-in">
        {useMockData && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Using demo images - API temporarily unavailable
            </p>
          </div>
        )}
        
        <div className="columns-2 gap-4">
          {curates.map((curate, index) => (
            <CurateImage 
              key={curate.id} 
              curate={curate} 
              index={index}
              onImageClick={() => setSelectedCurate(curate)}
              isNew={newItems.has(curate.id)}
            />
          ))}
        </div>
        
        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 bg-[var(--app-accent)] rounded-full animate-pulse"></div>
          </div>
        )}
        
        {/* End of content indicator */}
        {!hasMore && curates.length > 0 && !useMockData && (
          <div className="text-center py-8 text-[var(--app-foreground-muted)]">
            <p className="text-sm">You've seen all the curations!</p>
          </div>
        )}
      </div>

      {/* Image Detail Modal */}
      {selectedCurate && (
        <ImageDetail
          curate={selectedCurate}
          onClose={() => setSelectedCurate(null)}
          onCurate={() => {
            console.log('Curating:', selectedCurate);
            // Trigger immediate check for new curates after successful curation
            setTimeout(() => {
              checkForNewCurates();
            }, 5000); // Wait 5 seconds for blockchain/subgraph to update
          }}
          onNavigateToBoard={onNavigateToBoard}
        />
      )}
    </div>
  );
}