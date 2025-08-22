"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { BottomNavigation } from "../../components/ui";
import { ProfileView } from "../../components/features/Profile/ProfileView";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { address: currentUserAddress } = useAccount();
  const profileAddress = params.address as string;
  // Only show profile as active if it's the user's own profile
  const isOwnProfile = currentUserAddress && currentUserAddress.toLowerCase() === profileAddress.toLowerCase();
  const [activeTab] = useState(isOwnProfile ? "profile" : "");

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
      // If viewing own profile, stay here, otherwise go to own profile
      if (currentUserAddress && currentUserAddress.toLowerCase() !== profileAddress.toLowerCase()) {
        router.push(`/u/${currentUserAddress}`);
      }
    }
  }, [router, currentUserAddress, profileAddress]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3 pb-20 bg-black min-h-screen">
        {/* Simple back button - only show when viewing other profiles */}
        {!isOwnProfile && (
          <div className="mb-6 pt-4">
            <button 
              onClick={handleBack}
              className="text-[#0052FF] hover:opacity-80 transition-opacity"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* Profile View Component */}
        <ProfileView userAddress={profileAddress} />
      </div>
      <BottomNavigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />
    </div>
  );
}