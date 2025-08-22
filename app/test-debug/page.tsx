"use client";

import { useState, useEffect } from "react";
import { useAccount, useEnsName, useEnsAvatar } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { 
  Identity,
  Name,
  Avatar,
  Badge,
  Address,
  IdentityCard,
  getName,
  getAvatar
} from "@coinbase/onchainkit/identity";
import { ConnectedIdentity } from "@/app/components/features/BaseAccount/ConnectedIdentity";

export default function TestDebugPage() {
  const { address, isConnected, chain } = useAccount();
  const [onchainKitName, setOnchainKitName] = useState<string | null>(null);
  const [onchainKitAvatar, setOnchainKitAvatar] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  
  // Try to get ENS name with base chain
  const { data: ensNameBase, isLoading: loadingBase, error: errorBase } = useEnsName({
    address: address,
    chainId: base.id,
  });
  
  // Try to get ENS name with baseSepolia
  const { data: ensNameSepolia, isLoading: loadingSepolia, error: errorSepolia } = useEnsName({
    address: address,
    chainId: baseSepolia.id,
  });
  
  // Try to get ENS name with current chain
  const { data: ensNameCurrent, isLoading: loadingCurrent, error: errorCurrent } = useEnsName({
    address: address,
    chainId: chain?.id,
  });
  
  // Get avatar
  const { data: avatarBase } = useEnsAvatar({
    name: ensNameBase || undefined,
    chainId: base.id,
  });
  
  const { data: avatarCurrent } = useEnsAvatar({
    name: ensNameCurrent || undefined,
    chainId: chain?.id,
  });
  
  // Test OnchainKit functions directly
  const testOnchainKitFunctions = async () => {
    if (!address) return;
    
    setTestLoading(true);
    setTestError(null);
    setOnchainKitName(null);
    setOnchainKitAvatar(null);
    
    try {
      // Test getName
      console.log('Testing getName with address:', address);
      const name = await getName({ address, chain: base });
      console.log('getName result:', name);
      setOnchainKitName(name || 'No name found');
      
      // Test getAvatar if name exists
      if (name) {
        console.log('Testing getAvatar with name:', name);
        const avatar = await getAvatar({ ensName: name, chain: base });
        console.log('getAvatar result:', avatar);
        setOnchainKitAvatar(avatar || 'No avatar found');
      }
    } catch (err) {
      console.error('OnchainKit test error:', err);
      setTestError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTestLoading(false);
    }
  };
  
  useEffect(() => {
    if (isConnected && address) {
      testOnchainKitFunctions();
    }
  }, [isConnected, address]);
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-8">Debug Name Resolution</h1>
      
      <div className="space-y-6">
        {/* Connection Info */}
        <div className="border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Connection Status</h2>
          <div className="space-y-2 text-sm">
            <p>Connected: <span className="text-green-500">{isConnected ? 'Yes' : 'No'}</span></p>
            <p>Address: <span className="text-gray-400">{address || 'Not connected'}</span></p>
            <p>Current Chain: <span className="text-gray-400">{chain?.name || 'Unknown'} (ID: {chain?.id})</span></p>
          </div>
        </div>
        
        {/* OnchainKit Direct Function Test */}
        <div className="border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">OnchainKit Direct Functions</h2>
          <button 
            onClick={testOnchainKitFunctions}
            disabled={!isConnected || testLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mb-3"
          >
            {testLoading ? 'Testing...' : 'Test Functions'}
          </button>
          <div className="space-y-2 text-sm">
            <p>Name Result: <span className="text-green-400">{onchainKitName || 'Not tested'}</span></p>
            <p>Avatar Result: <span className="text-green-400">{onchainKitAvatar || 'Not tested'}</span></p>
            {testError && <p className="text-red-400">Error: {testError}</p>}
          </div>
        </div>
        
        {/* ENS Resolution Debug */}
        <div className="border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Wagmi ENS/Basename Resolution</h2>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-gray-900 rounded">
              <p className="font-medium text-blue-400">Base Mainnet (Chain 8453):</p>
              <p>Loading: {loadingBase ? 'Yes' : 'No'}</p>
              <p>Name: <span className="text-green-400">{ensNameBase || 'None'}</span></p>
              <p>Avatar: {avatarBase ? 'Yes' : 'No'}</p>
              {errorBase && <p className="text-red-400">Error: {errorBase.message}</p>}
            </div>
            
            <div className="p-3 bg-gray-900 rounded">
              <p className="font-medium text-yellow-400">Base Sepolia (Chain 84532):</p>
              <p>Loading: {loadingSepolia ? 'Yes' : 'No'}</p>
              <p>Name: <span className="text-green-400">{ensNameSepolia || 'None'}</span></p>
              {errorSepolia && <p className="text-red-400">Error: {errorSepolia.message}</p>}
            </div>
            
            <div className="p-3 bg-gray-900 rounded">
              <p className="font-medium text-purple-400">Current Chain ({chain?.id}):</p>
              <p>Loading: {loadingCurrent ? 'Yes' : 'No'}</p>
              <p>Name: <span className="text-green-400">{ensNameCurrent || 'None'}</span></p>
              <p>Avatar: {avatarCurrent ? 'Yes' : 'No'}</p>
              {errorCurrent && <p className="text-red-400">Error: {errorCurrent.message}</p>}
            </div>
          </div>
        </div>
        
        {/* OnchainKit Identity Component Tests */}
        {isConnected && address && (
          <div className="border border-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">OnchainKit Identity Components</h2>
            <div className="space-y-4">
              {/* Test with Base chain */}
              <div className="p-3 bg-gray-900 rounded">
                <p className="text-sm text-gray-400 mb-2">Identity with Base chain:</p>
                <Identity address={address} chain={base}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10" />
                    <Name className="text-white" />
                  </div>
                </Identity>
              </div>
              
              {/* Test with BaseSepolia chain */}
              <div className="p-3 bg-gray-900 rounded">
                <p className="text-sm text-gray-400 mb-2">Identity with BaseSepolia chain:</p>
                <Identity address={address} chain={baseSepolia}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10" />
                    <Name className="text-white" />
                  </div>
                </Identity>
              </div>
              
              {/* Test without chain (uses provider default) */}
              <div className="p-3 bg-gray-900 rounded">
                <p className="text-sm text-gray-400 mb-2">Identity without chain prop:</p>
                <Identity address={address}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10" />
                    <Name className="text-white" />
                  </div>
                </Identity>
              </div>
            </div>
          </div>
        )}
        
        {/* ConnectedIdentity Component */}
        <div className="border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">ConnectedIdentity Component (Used in Profile)</h2>
          <ConnectedIdentity />
        </div>
        
        {/* IdentityCard Test - Exactly from docs */}
        <div className="border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">IdentityCard - Exactly as documented</h2>
          <div className="space-y-4">
            <div className="p-3 bg-gray-900 rounded">
              <p className="text-sm text-gray-400 mb-2">Example from docs:</p>
              <IdentityCard 
                address="0x4bEf0221d6F7Dd0C969fe46a4e9b339a84F52FDF"
                chain={base}
                schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
              />
            </div>
            
            {address && (
              <div className="p-3 bg-gray-900 rounded">
                <p className="text-sm text-gray-400 mb-2">Your address:</p>
                <IdentityCard 
                  address={address}
                  chain={base}
                />
              </div>
            )}
            
            <div className="p-3 bg-gray-900 rounded">
              <p className="text-sm text-gray-400 mb-2">Jesse Pollak (should have basename):</p>
              <IdentityCard 
                address="0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1"
                chain={base}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}