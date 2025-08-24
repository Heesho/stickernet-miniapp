"use client";

import { useEffect, useState } from "react";
import { Home, Board, Features, Profile, Notifications, Search, Create } from "./components/features";

interface AppContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  boardData: {tokenId?: string; tokenAddress?: string} | null;
  onNavigateToBoard: (tokenId: string, tokenAddress: string) => void;
}

export default function AppContent({ activeTab, setActiveTab, boardData, onNavigateToBoard }: AppContentProps) {
  // Remove the loading state completely - just render the content
  // MiniKit is handled by the provider and doesn't need to block rendering

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 pb-20 bg-black min-h-screen">
      <main className="flex-1">
        {activeTab === "home" && <Home setActiveTab={setActiveTab} onNavigateToBoard={onNavigateToBoard} />}
        {activeTab === "browse" && <Search setActiveTab={setActiveTab} />}
        {activeTab === "board" && <Board tokenId={boardData?.tokenId} tokenAddress={boardData?.tokenAddress} setActiveTab={setActiveTab} />}
        {activeTab === "features" && <Features setActiveTab={setActiveTab} />}
        {activeTab === "search" && <Search setActiveTab={setActiveTab} />}
        {activeTab === "create" && <Create setActiveTab={setActiveTab} />}
        {activeTab === "activity" && <Notifications setActiveTab={setActiveTab} />}
        {activeTab === "notifications" && <Notifications setActiveTab={setActiveTab} />}
        {activeTab === "profile" && <Profile setActiveTab={setActiveTab} />}
      </main>
    </div>
  );
}