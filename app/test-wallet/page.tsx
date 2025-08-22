"use client";

import { ConnectedIdentity } from "@/app/components/features/BaseAccount/ConnectedIdentity";
import { useAccount } from "wagmi";

export default function TestWalletPage() {
  const { address, isConnected } = useAccount();
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-8">Wallet Identity Test</h1>
      
      <div className="space-y-8">
        {/* Test ConnectedIdentity - This is what shows in the profile */}
        <div className="border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Profile Identity (Click to see dropdown)</h2>
          <p className="text-sm text-gray-400 mb-4">
            This component shows avatar + name/address. Click to open dropdown with options.
          </p>
          <ConnectedIdentity />
        </div>
        
        {/* Status Display */}
        <div className="border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">What should be displayed:</h2>
          <ul className="space-y-2 text-sm">
            <li>✅ Avatar circle (from Basename if available)</li>
            <li>✅ Name next to avatar (Basename like "tina.base.eth" or address like "0x1234...5678")</li>
            <li>✅ Clickable to open dropdown</li>
            <li>✅ Dropdown has options to disconnect, manage basename, etc.</li>
          </ul>
        </div>
        
        {/* Debug Info */}
        <div className="border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Debug Info</h2>
          <div className="space-y-2 text-sm">
            <p>Connected: <span className="text-green-500">{isConnected ? 'Yes' : 'No'}</span></p>
            <p>Address: <span className="text-gray-400">{address || 'Not connected'}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}