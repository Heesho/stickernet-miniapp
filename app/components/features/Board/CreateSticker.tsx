"use client";

import { useState, useEffect } from "react";
import Image from 'next/image';
import { useAccount } from 'wagmi';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { fetchTokenBoardData } from "@/lib/api/subgraph";
import { ROUTER_ADDRESS, ROUTER_ABI } from "@/lib/constants";

interface CreateStickerProps {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateSticker({ tokenAddress, tokenSymbol, tokenName, onClose, onSuccess }: CreateStickerProps) {
  const { address: userAddress, isConnected } = useAccount();
  const [url, setUrl] = useState("");
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [isValidUrl, setIsValidUrl] = useState(false);

  // Contract write hook for createContent
  const { 
    data: hash,
    isPending: isCreating,
    writeContract 
  } = useWriteContract();

  // Wait for transaction receipt
  const { 
    isLoading: isConfirming,
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Fetch price change from subgraph
  useEffect(() => {
    const fetchPriceChange = async () => {
      try {
        const boardData = await fetchTokenBoardData(tokenAddress.toLowerCase());
        if (boardData?.tokenDayData && boardData.tokenDayData.length >= 2) {
          const currentPrice = parseFloat(boardData.marketPrice || "0");
          const yesterdayPrice = parseFloat(boardData.tokenDayData[1].marketPrice || "0");
          if (yesterdayPrice > 0) {
            const change = ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100;
            setPriceChange24h(change);
          }
        }
      } catch (error) {
        console.error('Error fetching price change:', error);
      }
    };
    fetchPriceChange();
  }, [tokenAddress]);

  // Dynamic color theme based on price change (Robinhood-style)
  const priceIsUp = priceChange24h !== null ? priceChange24h >= 0 : true;
  const themeColor = priceIsUp ? '#0052FF' : '#FF6B35'; // Blue when up, Orange when down
  const themeColorClass = priceIsUp ? 'text-[#0052FF]' : 'text-[#FF6B35]';
  const themeBgClass = priceIsUp ? 'bg-[#0052FF]' : 'bg-[#FF6B35]';

  // Validate URL format
  useEffect(() => {
    const urlPattern = /^https:\/\/(memedepot\.com|.*\.(jpg|jpeg|png|gif|webp)).*$/i;
    setIsValidUrl(urlPattern.test(url));
    setImageError(false); // Reset error when URL changes
    setImageLoaded(false);
  }, [url]);

  // Handle successful transaction
  useEffect(() => {
    if (isConfirmed && onSuccess) {
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }
  }, [isConfirmed, onSuccess, onClose]);

  const handleCreate = async () => {
    if (!url || !isValidUrl || !userAddress) return;

    try {
      // Call createContent on the Router contract
      writeContract({
        address: ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'createContent',
        args: [tokenAddress as `0x${string}`, url], // token address and uri
        chainId: baseSepolia.id,
      });
    } catch (error) {
      console.error('Error creating content:', error);
    }
  };

  const isLoading = isCreating || isConfirming;

  return (
    <div className="fixed inset-0 bg-background z-50 flex justify-center">
      <div className="w-full max-w-md bg-black min-h-screen flex flex-col">
        {/* Header with close button */}
        <div className="flex items-center justify-start p-4">
          <button 
            onClick={onClose}
            className={`w-10 h-10 flex items-center justify-center ${themeColorClass} hover:opacity-80 transition-all`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-6 flex flex-col">
          {/* Title */}
          <h1 className="text-white text-2xl font-bold mb-8">
            Create Sticker for {tokenSymbol || tokenName || 'Token'}
          </h1>

          {/* Form */}
          <div className="space-y-6 flex-1">
            {/* URL Input Section */}
            <div>
              <div className={`${themeColorClass} text-base mb-2 italic`}>Enter URL</div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter an image URL"
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-gray-400 text-xs mt-2">
                Enter a direct image URL
              </div>
              {url && !isValidUrl && (
                <div className="text-red-400 text-xs mt-2">
                  Please enter a valid image URL
                </div>
              )}
            </div>

            {/* Image Preview Section */}
            {url && isValidUrl && (
              <div>
                <div className={`${themeColorClass} text-base mb-2 italic`}>Preview</div>
                <div className="flex items-center justify-center">
                  {!imageError ? (
                    <div className="relative w-60 h-60">
                      {!imageLoaded && (
                        <div className="absolute inset-0 bg-gray-800 animate-pulse rounded-2xl"></div>
                      )}
                      <Image
                        src={url}
                        alt="Sticker preview"
                        width={240}
                        height={240}
                        className={`w-60 h-60 object-cover rounded-2xl transition-opacity duration-300 ${
                          imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                      />
                    </div>
                  ) : (
                    <div className="w-60 h-60 bg-gray-800 rounded-2xl flex items-center justify-center">
                      <div className="text-gray-500 text-sm text-center px-4">
                        Unable to load image
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Transaction Status */}
          {(isCreating || isConfirming || isConfirmed) && (
            <div className="mb-4 p-3 rounded-xl bg-gray-900">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">Transaction Status</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isConfirmed
                    ? 'bg-green-500/20 text-green-400' :
                  (isCreating || isConfirming)
                    ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {isConfirmed
                    ? 'Success!' :
                   (isCreating || isConfirming)
                    ? 'Processing...' : 'Ready'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Create Button - Fixed above navbar */}
        <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-black p-3">
          <div className="flex items-center">
            <button
              onClick={handleCreate}
              disabled={isLoading || !isValidUrl || !url || !isConnected}
              className={`font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex-1 ${
                isLoading 
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                  : (!isValidUrl || !url || !isConnected)
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : isConfirmed
                  ? 'bg-green-500 text-white'
                  : `${themeBgClass} hover:opacity-90 text-white shadow-lg hover:shadow-xl`
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Sticking...</span>
                </div>
              ) : isConfirmed ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span>Stuck!</span>
                </div>
              ) : !isConnected ? (
                'Connect Wallet'
              ) : (
                'Stick'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}