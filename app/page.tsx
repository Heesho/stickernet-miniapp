"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
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

  const handleNavigateToBoard = (tokenId: string, tokenAddress: string) => {
    setBoardData({ tokenId, tokenAddress });
    setActiveTab("board");
  };

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <AppContent 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        boardData={boardData}
        onNavigateToBoard={handleNavigateToBoard}
      />
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
