"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectWallet, Wallet } from "@coinbase/onchainkit/wallet";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { isConnected, isConnecting } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="w-full max-w-md mx-auto bg-black min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Show signin page if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="w-full max-w-md mx-auto bg-black min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-sm flex flex-col items-center justify-center space-y-8">
          {/* Logo and App Name */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center shadow-2xl p-4">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <path 
                  d="M40 20 C20 20, 0 40, 0 60 L0 140 C0 160, 20 180, 40 180 L80 180 L80 120 C80 100, 100 80, 120 80 L180 80 L180 60 C180 40, 160 20, 140 20 Z M120 100 C100 100, 100 100, 100 120 L100 160 L140 160 C160 160, 180 140, 180 120 L180 100 Z M100 160 L180 100" 
                  fill="black"
                  fillRule="evenodd"
                />
              </svg>
            </div>
            <div className="text-center">
              <h1 className="text-5xl font-bold text-white">stickr</h1>
            </div>
          </div>

          {/* Sign In Button */}
          <div className="w-full flex flex-col items-center">
            <Wallet>
              <ConnectWallet
                className="bg-black text-white border-2 border-white hover:bg-gray-900 transition-colors rounded-xl px-8 py-4 font-semibold text-lg"
                text="Sign in"
              />
            </Wallet>
            
            {isConnecting && (
              <p className="text-gray-500 text-sm text-center mt-3">Connecting wallet...</p>
            )}
          </div>
        </div>
        </div>
      </div>
    );
  }

  // User is authenticated, show the app
  return <>{children}</>;
}