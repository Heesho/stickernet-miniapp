"use client";

import { Board } from "../components/features/Board/Board";
import { BottomNavigation } from "../components/ui";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export default function TokenPage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = params.tokenId as string;
  const [activeTab] = useState("board"); // Set active tab to "board" for token pages

  // Handle navigation from bottom nav
  const handleSetActiveTab = useCallback((tab: string) => {
    if (tab === "home" || tab === "browse" || tab === "create" || tab === "activity" || tab === "profile") {
      router.push("/");
    }
  }, [router]);

  // Handle back button in Board component
  const handleBoardSetActiveTab = useCallback((tab: string) => {
    if (tab === "home") {
      router.push("/");
    }
  }, [router]);

  // For now, we'll use the tokenId as both tokenId and tokenAddress
  // In production, you might need to fetch the tokenAddress from the tokenId
  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3 pb-20 bg-black min-h-screen">
        <main className="flex-1">
          <Board 
            tokenId={tokenId} 
            tokenAddress={tokenId}
            setActiveTab={handleBoardSetActiveTab}
          />
        </main>
      </div>
      <BottomNavigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />
    </div>
  );
}