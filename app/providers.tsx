"use client";

import { type ReactNode, useState, useEffect } from "react";
import { base, baseSepolia } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";

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
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors: [
    coinbaseWallet({
      appName: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "StickerNet",
      appLogoUrl: "/stickernet-logo.png",
      preference: "smartWalletOnly", // Force Smart Wallet only
    }),
  ],
  ssr: true, // Enable SSR support
});

// Client-side only wrapper to prevent hydration mismatches
function ClientOnlyProviders({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Always provide the providers, but use a fallback loading state when not mounted
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
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
            },
          }}
          // Additional OnchainKit provider props for Identity components
          projectId={process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID}
          schemaId={process.env.NEXT_PUBLIC_ONCHAINKIT_SCHEMA_ID}
        >
          {!isMounted ? (
            <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] bg-black">
              <div className="flex items-center justify-center h-screen">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          ) : (
            children
          )}
        </MiniKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function Providers(props: { children: ReactNode }) {
  return <ClientOnlyProviders>{props.children}</ClientOnlyProviders>;
}
