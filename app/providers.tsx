"use client";

import { type ReactNode, useState, useEffect } from "react";
import { base, baseSepolia } from "viem/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { LoadingProvider } from "@/app/contexts/LoadingContext";
import { UserProvider } from "@/app/contexts/UserContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Configure for Base MiniApp with Smart Wallet only
const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || ''}`),
    [baseSepolia.id]: http(),
  },
  connectors: [
    coinbaseWallet({
      appName: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "StickerNet",
      appLogoUrl: "/stickernet-logo.png",
      preference: "smartWalletOnly", // Force Smart Wallet only
      version: "4", // Use latest version for better Smart Wallet support
      headlessMode: false, // Enable UI for better UX
    }),
  ],
  ssr: true, // Enable SSR support
});

// Client-side only wrapper to prevent hydration mismatches
function ClientOnlyProviders({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <LoadingProvider>
            <OnchainKitProvider
              apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || ""}
              chain={base}
            >
              <MiniKitProvider
                apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
                chain={baseSepolia}
                config={{
                  appearance: {
                    mode: "auto",
                    theme: "mini-app",
                    name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "StickerNet",
                    logo: "/stickernet-logo.png",
                  },
                  wallet: {
                    termsUrl: "https://yourapp.com/terms",
                    privacyUrl: "https://yourapp.com/privacy",
                    preference: "smartWalletOnly",
                  },
                }}
              >
                {children}
              </MiniKitProvider>
            </OnchainKitProvider>
          </LoadingProvider>
        </UserProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function Providers(props: { children: ReactNode }) {
  return <ClientOnlyProviders>{props.children}</ClientOnlyProviders>;
}
