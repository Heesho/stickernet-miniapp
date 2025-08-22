"use client";

import { IdentityCard, Avatar, Name } from '@coinbase/onchainkit/identity';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'viem/chains';
import { useAccount } from 'wagmi';

export default function TestSimplePage() {
  const { address } = useAccount();
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-8">Simple Identity Test</h1>
      
      {/* Wrap in its own provider to ensure proper setup */}
      <OnchainKitProvider
        apiKey="6247d08e-f9d6-422d-b358-bd1db46c97c3"
        chain={base}
      >
        <div className="space-y-8">
          {/* Test 1: Known address with basename */}
          <div className="border border-gray-700 p-4 rounded">
            <h2 className="text-lg mb-4">Jesse Pollak (jesse.base.eth)</h2>
            <IdentityCard 
              address="0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1"
              chain={base}
            />
          </div>

          {/* Test 2: Direct components */}
          <div className="border border-gray-700 p-4 rounded">
            <h2 className="text-lg mb-4">Direct Components (Jesse)</h2>
            <div className="flex items-center gap-3">
              <Avatar 
                address="0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1"
                chain={base}
                className="h-12 w-12"
              />
              <Name 
                address="0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1"
                chain={base}
                className="text-white text-lg"
              />
            </div>
          </div>

          {/* Test 3: Your address */}
          {address && (
            <>
              <div className="border border-gray-700 p-4 rounded">
                <h2 className="text-lg mb-4">Your Address</h2>
                <IdentityCard 
                  address={address}
                  chain={base}
                />
              </div>
              
              <div className="border border-gray-700 p-4 rounded">
                <h2 className="text-lg mb-4">Your Address (Direct)</h2>
                <div className="flex items-center gap-3">
                  <Avatar 
                    address={address}
                    chain={base}
                    className="h-12 w-12"
                  />
                  <Name 
                    address={address}
                    chain={base}
                    className="text-white text-lg"
                  />
                </div>
              </div>
            </>
          )}

          {/* Debug info */}
          <div className="border border-gray-700 p-4 rounded">
            <h2 className="text-lg mb-4">Debug</h2>
            <p>Your Address: {address || 'Not connected'}</p>
            <p>API Key: 6247d08e-f9d6-422d-b358-bd1db46c97c3</p>
            <p>Chain: Base Mainnet (8453)</p>
          </div>
        </div>
      </OnchainKitProvider>
    </div>
  );
}