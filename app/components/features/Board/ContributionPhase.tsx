"use client";

import { useState } from "react";
import { Button } from "../../ui";
import { formatUnits } from "viem";

interface ContributionPhaseProps {
  tokenSymbol: string;
  tokenName: string;
  tokenUri: string;
  totalContributed: bigint;
  contributionGoal: bigint;
  timeRemaining: number;
  userContributed: bigint;
  onContribute: (amount: number) => void;
}

export function ContributionPhase({
  tokenSymbol,
  tokenName,
  tokenUri,
  totalContributed = BigInt(0),
  contributionGoal = BigInt(100000000000), // $100k in USDC (6 decimals)
  timeRemaining = 86400, // 24 hours in seconds
  userContributed = BigInt(0),
  onContribute
}: ContributionPhaseProps) {
  const [contributionAmount, setContributionAmount] = useState<string>("");
  
  // Format values for display
  const totalContributedUSD = parseFloat(formatUnits(totalContributed, 6));
  const goalUSD = parseFloat(formatUnits(contributionGoal, 6));
  const userContributedUSD = parseFloat(formatUnits(userContributed, 6));
  const progressPercentage = (totalContributedUSD / goalUSD) * 100;
  
  // Format time remaining
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const timeDisplay = `${hours}h ${minutes}m`;

  const handleContribute = () => {
    const amount = parseFloat(contributionAmount);
    if (amount > 0) {
      onContribute(amount);
      setContributionAmount("");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 pb-20">
      {/* Header Section */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{tokenSymbol}</h1>
            <p className="text-gray-400">{tokenName}</p>
          </div>
          <img 
            src={tokenUri} 
            alt={tokenSymbol}
            className="w-16 h-16 rounded-xl object-cover"
          />
        </div>

        {/* Contribution Phase Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-sm font-medium mb-6">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse" />
          Contribution Phase
        </div>

        {/* Progress Section */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-baseline mb-2">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Contributed</p>
              <p className="text-3xl font-bold">${totalContributedUSD.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm mb-1">Goal</p>
              <p className="text-xl text-gray-300">${goalUSD.toLocaleString()}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <p className="text-gray-400 text-sm mt-2">{progressPercentage.toFixed(1)}% of goal reached</p>
          </div>

          {/* Time Remaining */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Time Remaining</span>
              <span className="text-lg font-semibold text-yellow-500">{timeDisplay}</span>
            </div>
          </div>
        </div>

        {/* Key Information */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Token Price</p>
            <p className="text-xl font-semibold">$0.001</p>
            <p className="text-gray-500 text-xs mt-1">Fixed during contribution</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Min Contribution</p>
            <p className="text-xl font-semibold">$10</p>
            <p className="text-gray-500 text-xs mt-1">USDC</p>
          </div>
        </div>

        {/* Your Position */}
        {userContributedUSD > 0 && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6">
            <p className="text-blue-400 text-sm mb-2">Your Position</p>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">${userContributedUSD.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Contributed</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold">{(userContributedUSD / 0.001).toLocaleString()}</p>
                <p className="text-gray-400 text-sm">{tokenSymbol} tokens</p>
              </div>
            </div>
          </div>
        )}

        {/* Contribution Input */}
        <div className="bg-gray-900 rounded-xl p-4 mb-4">
          <label className="text-gray-400 text-sm mb-2 block">Contribution Amount (USDC)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              placeholder="Enter amount..."
              min="10"
              className="flex-1 bg-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <button
              onClick={() => setContributionAmount("100")}
              className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              $100
            </button>
            <button
              onClick={() => setContributionAmount("500")}
              className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              $500
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            You will receive {contributionAmount ? (parseFloat(contributionAmount) / 0.001).toLocaleString() : "0"} {tokenSymbol} tokens
          </p>
        </div>

        {/* Contribute Button */}
        <Button
          onClick={handleContribute}
          disabled={!contributionAmount || parseFloat(contributionAmount) < 10}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Contribute {contributionAmount ? `$${contributionAmount}` : ""}
        </Button>

        {/* Information Cards */}
        <div className="mt-8 space-y-4">
          <div className="bg-gray-900/50 rounded-xl p-4">
            <h3 className="font-semibold mb-2 flex items-center">
              <span className="text-yellow-500 mr-2">⚡</span>
              How it works
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Everyone contributes at the same price ($0.001 per token)</li>
              <li>• Contribution phase ends in {timeDisplay} or when goal is reached</li>
              <li>• After contribution phase, token enters open market</li>
              <li>• Your tokens will be claimable after market opens</li>
            </ul>
          </div>

          <div className="bg-gray-900/50 rounded-xl p-4">
            <h3 className="font-semibold mb-2 flex items-center">
              <span className="text-blue-500 mr-2">💎</span>
              Benefits
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Fair launch - everyone gets the same price</li>
              <li>• No bots or front-running</li>
              <li>• Guaranteed allocation at fixed price</li>
              <li>• Automatic liquidity provision after phase ends</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}