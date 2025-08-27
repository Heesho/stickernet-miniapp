"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ImageDetail } from "../../../components/features/Home/ImageDetail";
import { LoadingSpinner, BottomNavigation } from "../../../components/ui";
import { executeGraphQLQuery } from "@/lib/constants";
import type { Curate } from "@/types";

export default function StickerPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const tokenAddress = params.address as string;
  const contentId = params.contentId as string;
  const [curate, setCurate] = useState<Curate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab] = useState(""); // No tab active since this is a detail view
  const [showingStealConfirmation, setShowingStealConfirmation] = useState(false);

  useEffect(() => {
    const fetchStickerData = async () => {
      try {
        setLoading(true);
        // Fetch the sticker data from the subgraph
        const response = await executeGraphQLQuery<{ contentPositions: any[] }>(`
          query GetSticker($tokenAddress: String!, $tokenId: String!) {
            contentPositions(where: { token: $tokenAddress, tokenId: $tokenId }) {
              id
              tokenId
              uri
              price
              nextPrice
              creator {
                id
              }
              owner {
                id
              }
              token {
                id
                name
                symbol
                uri
              }
            }
          }
        `, { 
          tokenAddress: tokenAddress.toLowerCase(), 
          tokenId: contentId 
        });

        if (response?.data?.contentPositions && response.data.contentPositions.length > 0) {
          const content = response.data.contentPositions[0];
          // Transform to Curate format
          const curateData: Curate = {
            id: content.id,
            tokenId: BigInt(content.tokenId),
            uri: content.uri,
            timestamp: Date.now().toString(),
            price: content.price,
            creator: content.creator,
            user: content.owner,
            token: content.token
          };
          setCurate(curateData);
        } else {
          setError('Sticker not found');
        }
      } catch (err) {
        console.error('Error fetching sticker data:', err);
        setError('Failed to load sticker');
      } finally {
        setLoading(false);
      }
    };

    fetchStickerData();
  }, [tokenAddress, contentId]);

  const handleClose = () => {
    router.back();
  };

  const handleCurate = () => {
    // This will be handled by the ImageDetail component
    // which has the trading logic built in
  };

  const handleNavigateToBoard = (tokenId: string, tokenAddress: string) => {
    router.push(`/b/${tokenAddress}`);
  };

  // Handle navigation from bottom nav
  const handleSetActiveTab = useCallback((tab: string) => {
    if (tab === "home") {
      router.push("/?tab=home");
    } else if (tab === "browse") {
      router.push("/?tab=browse");
    } else if (tab === "create") {
      router.push("/?tab=create");
    } else if (tab === "activity") {
      router.push("/?tab=activity");
    } else if (tab === "profile") {
      // Navigate to user's profile if connected
      if (address) {
        router.push(`/u/${address}`);
      } else {
        router.push("/?tab=profile");
      }
    }
  }, [router, address]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner size="lg" />
        </div>
        <BottomNavigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />
      </div>
    );
  }

  if (error || !curate) {
    return (
      <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
        <div className="w-full max-w-md mx-auto px-4 py-3 pb-20 bg-black min-h-screen">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-white mb-4">{error || 'Sticker not found'}</p>
              <button 
                onClick={() => router.push(`/b/${tokenAddress}`)}
                className="text-[#0052FF] hover:opacity-80"
              >
                Back to Board
              </button>
            </div>
          </div>
        </div>
        <BottomNavigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3 pb-20 bg-black min-h-screen">
        <div className="fixed inset-0 pt-12 z-40 flex items-center justify-center bg-black/95 pwa-safe-top ios-standalone-top">
          <ImageDetail 
            curate={curate}
            onClose={handleClose}
            onCurate={handleCurate}
            onNavigateToBoard={handleNavigateToBoard}
            onStealConfirmationChange={setShowingStealConfirmation}
          />
        </div>
      </div>
      {!showingStealConfirmation && <BottomNavigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />}
    </div>
  );
}