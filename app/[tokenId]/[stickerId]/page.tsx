"use client";

import { ImageDetail } from "../../components/features/Home/ImageDetail";
import { BottomNavigation } from "../../components/ui";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { fetchTokenBoardData } from "@/lib/api/subgraph";
import { LoadingSpinner } from "../../components/ui";

export default function StickerPage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = params.tokenId as string;
  const stickerId = params.stickerId as string;
  const [activeTab] = useState("");
  const [curateData, setCurateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle navigation from bottom nav
  const handleSetActiveTab = useCallback((tab: string) => {
    if (tab === "home" || tab === "browse" || tab === "create" || tab === "activity" || tab === "profile") {
      router.push("/");
    }
  }, [router]);

  // Load sticker data
  useEffect(() => {
    const loadStickerData = async () => {
      try {
        setLoading(true);
        const tokenData = await fetchTokenBoardData(tokenId);
        
        if (tokenData && tokenData.contentPositions) {
          const stickerData = tokenData.contentPositions.find(
            (content: any) => content.tokenId === stickerId
          );
          
          if (stickerData) {
            // Format data to match ImageDetail expectations
            setCurateData({
              id: `${tokenId}-${stickerId}`,
              tokenId: stickerId,
              uri: stickerData.uri,
              price: stickerData.price,
              token: {
                id: tokenId,
                name: tokenData.name,
                symbol: tokenData.symbol,
                uri: tokenData.uri
              },
              creator: stickerData.creator,
              owner: stickerData.owner,
              timestamp: Date.now()
            });
          } else {
            setError("Sticker not found");
          }
        } else {
          setError("Token data not found");
        }
      } catch (err) {
        console.error("Error loading sticker data:", err);
        setError("Failed to load sticker data");
      } finally {
        setLoading(false);
      }
    };

    loadStickerData();
  }, [tokenId, stickerId]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
        <div className="w-full max-w-md mx-auto px-4 py-3 pb-20 bg-black min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" variant="accent" />
        </div>
        <BottomNavigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />
      </div>
    );
  }

  if (error || !curateData) {
    return (
      <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
        <div className="w-full max-w-md mx-auto px-4 py-3 pb-20 bg-black min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-white mb-4">{error || "Sticker not found"}</p>
            <button 
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Go Home
            </button>
          </div>
        </div>
        <BottomNavigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto bg-black min-h-screen">
        <ImageDetail
          curate={curateData}
          onClose={() => router.back()}
          onCurate={() => {
            console.log("Curating:", curateData);
          }}
          // Don't provide onNavigateToBoard so ImageDetail uses router directly
        />
      </div>
      <BottomNavigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />
    </div>
  );
}