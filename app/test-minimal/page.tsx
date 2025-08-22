"use client";

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'viem/chains';
import { coinbaseWallet } from 'wagmi/connectors';
import { 
  IdentityCard,
  Avatar,
  Name,
  Identity,
  Badge,
  Address
} from '@coinbase/onchainkit/identity';
import { useAccount } from 'wagmi';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';

// Create a minimal config just for this test
const queryClient = new QueryClient();
const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
  connectors: [
    coinbaseWallet({
      appName: "Test",
      preference: "smartWalletOnly",
    }),
  ],
});

function TestContent() {
  const { address, isConnected } = useAccount();
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-8">Minimal Identity Test</h1>
      
      {/* Connect Wallet */}
      <div className="mb-8">
        <Wallet>
          <ConnectWallet className="bg-blue-600 text-white px-4 py-2 rounded">
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>
      
      <div className="space-y-8">
        {/* Test with the example from docs */}
        <div className="border border-gray-700 p-4 rounded">
          <h2 className="text-lg mb-4">Example from docs (should show basename)</h2>
          <IdentityCard 
            address="0x4bEf0221d6F7Dd0C969fe46a4e9b339a84F52FDF"
            chain={base}
          />
        </div>
        
        {/* Your connected address */}
        {isConnected && address && (
          <>
            <div className="border border-gray-700 p-4 rounded">
              <h2 className="text-lg mb-4">Your address (IdentityCard)</h2>
              <IdentityCard 
                address={address}
                chain={base}
              />
            </div>
            
            <div className="border border-gray-700 p-4 rounded">
              <h2 className="text-lg mb-4">Your address (Individual components)</h2>
              <Identity address={address} chain={base}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12" />
                  <div>
                    <Name className="text-white text-lg" />
                    <Badge />
                    <Address className="text-sm text-gray-400" />
                  </div>
                </div>
              </Identity>
            </div>
            
            <div className="border border-gray-700 p-4 rounded">
              <h2 className="text-lg mb-4">Direct components (no Identity wrapper)</h2>
              <div className="flex items-center gap-3">
                <Avatar address={address} chain={base} className="h-12 w-12" />
                <Name address={address} chain={base} className="text-white text-lg" />
              </div>
            </div>
          </>
        )}
        
        {/* Debug info */}
        <div className="border border-gray-700 p-4 rounded">
          <h2 className="text-lg mb-4">Debug</h2>
          <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
          <p>Address: {address || 'Not connected'}</p>
          <p>Chain: Base Mainnet (8453)</p>
        </div>
      </div>
    </div>
  );
}

export default function TestMinimalPage() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey="6247d08e-f9d6-422d-b358-bd1db46c97c3"
          chain={base}
        >
          <TestContent />
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}