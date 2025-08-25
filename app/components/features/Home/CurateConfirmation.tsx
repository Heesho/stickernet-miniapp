"use client";

import { useState, useEffect } from "react";
// import Image from "next/image"; // Commented out - using regular img for Discord images
import { getProxiedImageUrl } from "@/lib/utils/image-proxy";
import { useAccount, useBalance } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { baseSepolia } from "wagmi/chains";
import { useCurateContent } from "../../../hooks/useCurateContent";
import { useContentData, useTokenData } from "../../../hooks/useMulticall";
import { USDC_CONTRACT, USDC_DECIMALS } from "@/lib/constants";
import { isValidTokenId } from "@/types";
import type { Curate } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils/formatters";

interface CurateConfirmationProps {
  curate: Curate;
  nextPrice: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CurateConfirmation({
  curate,
  nextPrice,
  onClose,
  onSuccess,
}: CurateConfirmationProps) {
  const { address: userAddress, isConnected } = useAccount();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get token data for weekly reward
  const tokenAddress = curate.token.id as `0x${string}`;
  const rawTokenId = curate.tokenId;
  const tokenId = isValidTokenId(rawTokenId) ? rawTokenId : undefined;

  // Get real-time on-chain data for weekly rewards
  const { weeklyReward } = useContentData({
    tokenAddress,
    tokenId,
    enabled: !!(tokenAddress && tokenId),
  });

  // Get USDC balance
  const { data: balanceData } = useBalance({
    address: userAddress,
    token: USDC_CONTRACT.address,
    chainId: baseSepolia.id,
  });

  // Curate content hook
  const {
    curate: executeCurate,
    isLoading: isCurateLoading,
    status,
    reset,
  } = useCurateContent();

  // Always use blue theme to match MAX timeframe default
  // This ensures consistency across all pages
  const themeColor = "#0052FF";
  const themeColorClass = "text-[#0052FF]";
  const themeBgClass = "bg-[#0052FF]";
  const themeBorderClass = "border-[#0052FF]";

  // Handle successful transaction
  useEffect(() => {
    if (
      status.approveStatus === "success" &&
      status.curateStatus === "success"
    ) {
      // Wait a moment to show success state, then call onSuccess
      const timer = setTimeout(() => {
        onSuccess();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, onSuccess]);

  // Handle curate button click
  const handleCurate = async () => {
    if (!nextPrice || parseFloat(nextPrice) <= 0) {
      console.error("Invalid next price for curation");
      return;
    }

    try {
      // Convert nextPrice from string to bigint (with USDC decimals)
      const nextPriceBigInt = parseUnits(nextPrice, USDC_DECIMALS);
      const tokenAddress = curate.token.id as `0x${string}`;

      await executeCurate({
        tokenAddress,
        tokenId: curate.tokenId,
        nextPrice: nextPriceBigInt,
      });
    } catch (error) {
      console.error("Curation failed:", error);
    }
  };

  // Format balance for display
  const formattedBalance = balanceData
    ? formatUnits(balanceData.value, USDC_DECIMALS)
    : "0";

  // Check if user has enough balance
  const hasEnoughBalance =
    balanceData && parseFloat(formattedBalance) >= parseFloat(nextPrice);

  return (
    <div className="fixed inset-0 bg-background z-50 flex justify-center">
      <div className="w-full max-w-md bg-black min-h-screen flex flex-col">
        {/* Header with close button */}
        <div className="flex items-center justify-start p-4">
          <button
            onClick={onClose}
            className={`w-10 h-10 flex items-center justify-center ${themeColorClass} hover:opacity-80 transition-all`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-6 flex flex-col">
          {/* Title */}
          <h1 className="text-white text-2xl font-bold mb-8">
            Steal {curate.token.symbol || curate.token.name || "PENGU"}{" "}
            {curate.tokenId.toString()}
          </h1>

          {/* Transaction Details */}
          <div className="space-y-6 flex-1">
            {/* Pay Section */}
            <div>
              <div className={`${themeColorClass} text-sm mb-2`}>Pay</div>
              <div className="text-white text-3xl font-medium tracking-wide">
                {nextPrice}
              </div>
              <div className="text-gray-600 text-xs mt-2">
                {formatCurrency(formattedBalance, 2, false)} available
              </div>
              {!hasEnoughBalance && (
                <div className="text-red-400 text-xs mt-2">
                  Insufficient USDC balance
                </div>
              )}
            </div>

            {/* Get Section */}
            <div>
              <div className={`${themeColorClass} text-sm mb-2`}>Get</div>
              <div className="flex items-center space-x-3">
                {!imageError ? (
                  <div className="relative w-20 h-20">
                    {!imageLoaded && (
                      <div className="absolute inset-0 bg-gray-800 animate-pulse rounded-2xl"></div>
                    )}
                    <img
                      src={getProxiedImageUrl(curate.uri)}
                      alt={`Curate ${curate.id}`}
                      className={`w-20 h-20 object-cover rounded-2xl transition-opacity duration-300 ${
                        imageLoaded ? "opacity-100" : "opacity-0"
                      }`}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center">
                    <div className="text-gray-500 text-xs">No image</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Status */}
          {(status.approveStatus !== "idle" ||
            status.curateStatus !== "idle") &&
            !(
              status.approveStatus === "success" &&
              status.curateStatus === "success"
            ) && (
              <div className="mb-4 p-3 rounded-xl bg-gray-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">
                    Transaction Status
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      status.approveStatus === "success" &&
                      status.curateStatus === "success"
                        ? "bg-green-500/20 text-green-400"
                        : status.approveStatus === "pending" ||
                            status.curateStatus === "pending"
                          ? "bg-yellow-500/20 text-yellow-400 animate-pulse"
                          : status.approveStatus === "error" ||
                              status.curateStatus === "error"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {status.approveStatus === "success" &&
                    status.curateStatus === "success"
                      ? "Complete"
                      : status.approveStatus === "pending" ||
                          status.curateStatus === "pending"
                        ? "Processing..."
                        : status.approveStatus === "error" ||
                            status.curateStatus === "error"
                          ? "Failed"
                          : "Ready"}
                  </span>
                </div>
                {status.error && (
                  <div className="mt-2 text-xs text-red-400">
                    {status.error}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Steal Button - Fixed at same position as previous page */}
      <div className="fixed bottom-20 left-0 right-0 z-40">
        <div className="w-full max-w-md mx-auto px-4">
          <button
            onClick={handleCurate}
            disabled={isCurateLoading || !hasEnoughBalance}
            className={`w-full font-semibold py-3 rounded-xl border-2 ${themeBorderClass} transition-all duration-200 focus:outline-none focus:ring-0 focus:ring-offset-0 ${
              isCurateLoading
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : !hasEnoughBalance
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : status.approveStatus === "success" &&
                      status.curateStatus === "success"
                    ? "bg-green-500 hover:bg-green-600 text-black"
                    : `${themeBgClass} hover:opacity-90 text-black`
            }`}
          >
            {isCurateLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Loading...</span>
              </div>
            ) : status.approveStatus === "success" &&
              status.curateStatus === "success" ? (
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Success!</span>
              </div>
            ) : !hasEnoughBalance ? (
              "Insufficient Balance"
            ) : (
              "Steal"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
