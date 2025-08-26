"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { baseSepolia } from "viem/chains";
import { ROUTER_ADDRESS, ROUTER_ABI } from "@/lib/constants";
import { Button } from "../../ui";

interface ClaimRewardsProps {
  tokenAddress: string;
  tokenSymbol: string;
  onClose: () => void;
  onTransactionSuccess?: (txHash?: string) => void;
  themeColor: string;
}

export function ClaimRewards({
  tokenAddress,
  tokenSymbol,
  onClose,
  onTransactionSuccess,
  themeColor,
}: ClaimRewardsProps) {
  const { address: userAddress, isConnected } = useAccount();
  const [hasClaimed, setHasClaimed] = useState(false);

  const {
    writeContract,
    data: hash,
    isPending: isClaiming,
    isError: isClaimError,
    error: claimError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle successful transaction
  useEffect(() => {
    if (isConfirmed && !hasClaimed) {
      setHasClaimed(true);
      if (onTransactionSuccess) {
        onTransactionSuccess(hash);
      }
      // Close modal after showing success
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  }, [isConfirmed, hasClaimed, onTransactionSuccess, hash, onClose]);

  const handleClaim = async () => {
    if (!userAddress) return;

    try {
      writeContract({
        address: ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: "getContentReward",
        args: [tokenAddress as `0x${string}`],
        chainId: baseSepolia.id,
      });
    } catch (error) {
      console.error("Error claiming rewards:", error);
    }
  };

  const isLoading = isClaiming || isConfirming;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 px-4">
      <div className="bg-black border border-[var(--app-border)] rounded-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Claim Rewards</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {!isConnected ? (
            <p className="text-gray-400 text-center py-4">
              Please connect your wallet to claim rewards
            </p>
          ) : isConfirmed ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✓</div>
              <p className="text-green-500 font-semibold">Rewards claimed successfully!</p>
              <p className="text-gray-400 text-sm mt-2">Your rewards have been sent to your wallet</p>
            </div>
          ) : (
            <>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2">Claiming rewards for</p>
                <p className="text-white font-semibold text-lg">{tokenSymbol}</p>
              </div>

              {isClaimError && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
                  <p className="text-red-400 text-sm">
                    {claimError?.message?.includes("User denied") 
                      ? "Transaction cancelled" 
                      : "Failed to claim rewards. Please try again."}
                  </p>
                </div>
              )}

              <Button
                onClick={handleClaim}
                disabled={isLoading || !isConnected}
                className="w-full"
                style={{ 
                  backgroundColor: isLoading ? '#333' : themeColor,
                  color: isLoading ? '#999' : '#000',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2">◌</span>
                    {isClaiming ? "Confirming..." : "Processing..."}
                  </span>
                ) : (
                  "Claim Rewards"
                )}
              </Button>

              <p className="text-gray-500 text-xs text-center">
                This will claim all available rewards for {tokenSymbol}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}