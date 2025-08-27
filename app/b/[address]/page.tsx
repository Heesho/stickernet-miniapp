"use client";

import { Board } from "../../components/features/Board/Board";
import { BottomNavigation } from "../../components/ui";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useAccount } from "wagmi";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const tokenAddress = params.address as string;
  const [activeTab] = useState("board");

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

  // Handle back button in Board component
  const handleBoardSetActiveTab = useCallback((tab: string) => {
    if (tab === "home") {
      // Use router.back() to return to the previous page instead of always going to home
      router.back();
    }
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto pb-20 bg-black min-h-screen">
        <main className="flex-1">
          <Board 
            tokenId={tokenAddress} 
            tokenAddress={tokenAddress}
            setActiveTab={handleBoardSetActiveTab}
          />
        </main>
      </div>
      <BottomNavigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />
    </div>
  );
}