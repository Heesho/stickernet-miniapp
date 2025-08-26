"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { BottomNavigation } from "./components/ui";
import AppContent from "./AppContent";

function AppInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address } = useAccount();
  
  // Initialize activeTab from URL or default to 'home'
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl && ['home', 'browse', 'create', 'activity', 'profile'].includes(tabFromUrl) 
    ? tabFromUrl 
    : 'home';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [boardData, setBoardData] = useState<{tokenId?: string; tokenAddress?: string} | null>(null);
  
  // Update activeTab when URL changes (e.g., from browser back/forward)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['home', 'browse', 'create', 'activity', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (!tabParam) {
      // If no tab param, default to home
      setActiveTab('home');
    }
  }, [searchParams]);

  const handleNavigateToBoard = (tokenId: string, tokenAddress: string) => {
    // Use URL-based routing with cleaner URL structure
    router.push(`/b/${tokenAddress}`);
  };

  // Enhanced setActiveTab handler that updates URL
  const handleSetActiveTab = useCallback((tab: string) => {
    setActiveTab(tab);
    // Update URL to persist tab selection
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.push(url.pathname + url.search, { scroll: false });
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <AppContent 
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        boardData={boardData}
        onNavigateToBoard={handleNavigateToBoard}
      />
      <BottomNavigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] bg-black">
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    }>
      <AppInner />
    </Suspense>
  );
}
