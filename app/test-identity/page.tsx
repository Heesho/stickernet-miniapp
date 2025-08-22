"use client";

import { BaseAccountAuthSimple } from "@/app/components/features/BaseAccount/BaseAccountAuthSimple";
import { BaseIdentitySimple, BaseIdentityCard, BaseIdentityInline } from "@/app/components/features/BaseAccount/BaseIdentitySimple";
import { 
  Identity,
  Name,
  Avatar,
  Badge,
  Address,
  IdentityCard as OnchainIdentityCard
} from "@coinbase/onchainkit/identity";
import { useAccount } from "wagmi";
import { base } from "wagmi/chains";

export default function TestIdentityPage() {
  const { address, isConnected } = useAccount();
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-8">Base Identity Components Test</h1>
      
      <div className="space-y-8">
        {/* Test BaseAccountAuthSimple */}
        <div className="border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Sign in with Base</h2>
          <BaseAccountAuthSimple />
        </div>
        
        {/* Test BaseIdentitySimple variations */}
        {isConnected && address && (
          <>
            <div className="border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">BaseIdentitySimple Variations</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Small size:</p>
                  <BaseIdentitySimple size="sm" address={address} />
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-2">Medium size (default):</p>
                  <BaseIdentitySimple address={address} />
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-2">Large size:</p>
                  <BaseIdentitySimple size="lg" address={address} />
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-2">With balance:</p>
                  <BaseIdentitySimple showBalance={true} address={address} />
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-2">With address:</p>
                  <BaseIdentitySimple showAddress={true} address={address} />
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-2">With both balance and address:</p>
                  <BaseIdentitySimple showBalance={true} showAddress={true} address={address} />
                </div>
              </div>
            </div>
            
            {/* Test BaseIdentityCard */}
            <div className="border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">BaseIdentityCard</h2>
              <BaseIdentityCard 
                address={address} 
                chain={base} 
                badgeTooltip="Base Verified"
                schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
              />
            </div>
            
            {/* Test Direct OnchainKit Components */}
            <div className="border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Direct OnchainKit Identity Components</h2>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Identity with Avatar + Name:</p>
                  <Identity address={address} chain={base}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12" />
                      <Name className="text-white text-lg" />
                      <Badge />
                    </div>
                  </Identity>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-2">OnchainKit IdentityCard with Badge Tooltip:</p>
                  <OnchainIdentityCard 
                    address={address}
                    chain={base}
                    schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
                    badgeTooltip={true}
                  />
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-2">Direct Avatar/Name (no wrapper):</p>
                  <div className="flex items-center gap-3">
                    <Avatar address={address} chain={base} className="h-12 w-12" />
                    <Name address={address} chain={base} className="text-white text-lg" />
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-2">Test with known basename (vitalik.eth):</p>
                  <Identity address="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" chain={base}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12" />
                      <Name className="text-white text-lg" />
                      <Badge />
                    </div>
                  </Identity>
                </div>
              </div>
            </div>
            
            {/* Test BaseIdentityInline */}
            <div className="border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">BaseIdentityInline (for lists)</h2>
              <div className="space-y-2">
                <div className="p-2 bg-gray-900 rounded">
                  User 1: <BaseIdentityInline address={address} />
                </div>
                <div className="p-2 bg-gray-900 rounded">
                  User 2: <BaseIdentityInline address="0x838aD0EAE54F99F1926dA7C3b6bFbF617389B4D9" />
                </div>
                <div className="p-2 bg-gray-900 rounded">
                  User 3: <BaseIdentityInline address="0x02feeb0AdE57b6adEEdE5A4EEea6Cf8415aDF0c2" />
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Connection Status */}
        <div className="border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
          <div className="space-y-2 text-sm">
            <p>Connected: <span className="text-green-500">{isConnected ? 'Yes' : 'No'}</span></p>
            <p>Address: <span className="text-gray-400">{address || 'Not connected'}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}