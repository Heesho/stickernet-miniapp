"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import dynamic from "next/dynamic";
import { BottomNavigation } from "../../components/ui";
import { LoadingSpinner, ErrorMessage } from "../../components/ui";

// Dynamic imports for OnchainKit components to prevent SSR issues
const Avatar = dynamic(() => import("@coinbase/onchainkit/identity").then(mod => ({ default: mod.Avatar })), { 
  ssr: false,
  loading: () => <div className="w-16 h-16 bg-gray-600 rounded-full animate-pulse" />
});

const Name = dynamic(() => import("@coinbase/onchainkit/identity").then(mod => ({ default: mod.Name })), { 
  ssr: false,
  loading: () => <div className="w-32 h-6 bg-gray-600 rounded animate-pulse" />
});

const Address = dynamic(() => import("@coinbase/onchainkit/identity").then(mod => ({ default: mod.Address })), { 
  ssr: false,
  loading: () => <div className="w-24 h-4 bg-gray-600 rounded animate-pulse" />
});

const EthBalance = dynamic(() => import("@coinbase/onchainkit/identity").then(mod => ({ default: mod.EthBalance })), { 
  ssr: false,
  loading: () => <div className="w-20 h-4 bg-gray-600 rounded animate-pulse" />
});

export default function AccountPage() {
  const params = useParams();
  const router = useRouter();
  const { address: currentUserAddress } = useAccount();
  const profileAddress = params.address as string;
  const [activeTab] = useState("profile"); // Set active tab for account pages
  const [loading, setLoading] = useState(true);
  const [isValidAddress, setIsValidAddress] = useState(false);

  // Validate the address format
  useEffect(() => {
    const validateAddress = () => {
      try {
        // Basic Ethereum address validation
        if (profileAddress && /^0x[a-fA-F0-9]{40}$/.test(profileAddress)) {
          setIsValidAddress(true);
        } else {
          setIsValidAddress(false);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error validating address:', error);
        setIsValidAddress(false);
        setLoading(false);
      }
    };

    validateAddress();
  }, [profileAddress]);

  // Handle navigation from bottom nav
  const handleSetActiveTab = useCallback((tab: string) => {
    if (tab === "home" || tab === "browse") {
      router.push("/");
    } else if (tab === "create") {
      router.push("/");
    } else if (tab === "activity") {
      router.push("/");
    } else if (tab === "profile") {
      // If viewing own profile, stay here, otherwise go to own profile
      if (currentUserAddress && currentUserAddress.toLowerCase() !== profileAddress.toLowerCase()) {
        router.push(`/account/${currentUserAddress}`);
      }
    }
  }, [router, currentUserAddress, profileAddress]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] bg-black">
        <div className="w-full max-w-md mx-auto px-4 py-3 pb-20 bg-black min-h-screen">
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="lg" variant="accent" />
          </div>
        </div>
        <BottomNavigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />
      </div>
    );
  }

  // Render error state for invalid address
  if (!isValidAddress) {
    return (
      <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] bg-black">
        <div className="w-full max-w-md mx-auto px-4 py-3 pb-20 bg-black min-h-screen">
          <ErrorMessage
            title="Invalid Address"
            message="The wallet address you're looking for is not valid"
            onRetry={() => router.push("/")}
            retryLabel="Go Home"
          />
        </div>
        <BottomNavigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />
      </div>
    );
  }

  const isOwnProfile = currentUserAddress && currentUserAddress.toLowerCase() === profileAddress.toLowerCase();

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] bg-black">
      <div className="w-full max-w-md mx-auto px-4 py-3 pb-20 bg-black min-h-screen">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <button 
            onClick={handleBack}
            className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">
            {isOwnProfile ? "Your Profile" : "Profile"}
          </h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        <main className="flex-1">
          <div className="animate-fade-in">
            {/* Profile Identity Section */}
            <div className="bg-gray-900 rounded-lg p-6 mb-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Avatar */}
                <Avatar 
                  address={profileAddress as `0x${string}`} 
                  className="w-20 h-20" 
                />
                
                {/* Name */}
                <div className="flex flex-col items-center space-y-2">
                  <Name 
                    address={profileAddress as `0x${string}`} 
                    className="text-xl font-semibold text-white" 
                  />
                  
                  {/* Address */}
                  <Address 
                    address={profileAddress as `0x${string}`} 
                    className="text-sm text-gray-400 font-mono" 
                  />
                  
                  {/* ETH Balance */}
                  <EthBalance 
                    address={profileAddress as `0x${string}`} 
                    className="text-sm text-gray-300" 
                  />
                </div>
              </div>
            </div>

            {/* Profile Stats Section */}
            <div className="bg-gray-900 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Activity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">0</div>
                  <div className="text-sm text-gray-400">Tokens Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">0</div>
                  <div className="text-sm text-gray-400">Stickers Owned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">0</div>
                  <div className="text-sm text-gray-400">Total Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">0</div>
                  <div className="text-sm text-gray-400">Followers</div>
                </div>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="text-center py-8">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-500 mx-auto mb-3">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <p className="text-gray-400 text-sm">No recent activity</p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <BottomNavigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />
    </div>
  );
}