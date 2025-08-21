"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { BottomNavigation } from "./components/ui";

// Dynamic import for components that use MiniKit to prevent SSR issues
const AppContent = dynamic(() => import("./AppContent"), { 
  ssr: false,
  loading: () => (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] bg-black">
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  )
});

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [boardData, setBoardData] = useState<{tokenId?: string; tokenAddress?: string} | null>(null);
  const router = useRouter();
  const { address } = useAccount();

  const handleNavigateToBoard = (tokenId: string, tokenAddress: string) => {
    // Use URL-based routing with cleaner URL structure
    router.push(`/${tokenAddress}`);
  };

  // Enhanced setActiveTab handler that uses router for certain tabs
  const handleSetActiveTab = useCallback((tab: string) => {
    if (tab === "profile") {
      // Navigate to user's own profile page
      if (address) {
        router.push(`/account/${address}`);
      } else {
        // If not connected, stay on current page and show profile tab
        setActiveTab(tab);
      }
    } else {
      setActiveTab(tab);
    }
  }, [router, address]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <AppContent 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        boardData={boardData}
        onNavigateToBoard={handleNavigateToBoard}
      />
      <BottomNavigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />
    </div>
  );
}
