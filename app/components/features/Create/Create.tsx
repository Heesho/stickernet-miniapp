"use client";

import { useState, useEffect, useCallback } from "react";
import { getProxiedImageUrl } from "@/lib/utils/image-proxy";
import { getIPFSUrl, uploadBoardMetadata, type BoardMetadata } from "@/lib/pinata";
import ImageUploadCompact from "../../ImageUploadCompact";
import { createPortal } from "react-dom";
import {
  useAccount,
  useReadContract,
  useWalletClient,
  usePublicClient,
  useSwitchChain,
} from "wagmi";
import {
  formatUnits,
  parseUnits,
  encodeFunctionData,
  parseEventLogs,
  numberToHex,
  type Address,
} from "viem";
import { baseSepolia } from "wagmi/chains";
import { Icon } from "../../ui";
import { useEnforceBaseWallet } from "../../../hooks/useBaseAccount";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  USDC_ADDRESS,
  USDC_ABI,
  USDC_DECIMALS,
  ROUTER_ADDRESS,
  ROUTER_ABI,
} from "@/lib/constants";
import { toast } from "sonner";
import type { CreateProps } from "./Create.types";

export function Create({ setActiveTab }: CreateProps) {
  const { address, isConnected, chain } = useAccount();
  const { isValidConnection } = useEnforceBaseWallet();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ipfsHash, setIpfsHash] = useState("");
  const [buyAmount, setBuyAmount] = useState("0");
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdMeta, setCreatedMeta] = useState<{
    name: string;
    symbol: string;
    imageUrl: string;
  }>({ name: "", symbol: "", imageUrl: "" });
  const [isMounted, setIsMounted] = useState(false);

  // Get user's USDC balance directly from the USDC contract
  const { data: usdcBalance, isLoading: isLoadingBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  const userBalance = usdcBalance
    ? parseFloat(formatUnits(usdcBalance, USDC_DECIMALS))
    : 0;

  const handleNumberPad = (value: string) => {
    let newValue = buyAmount;

    if (value === "<") {
      // Backspace
      if (newValue.length > 1) {
        newValue = newValue.slice(0, -1);
      } else {
        newValue = "0";
      }
    } else if (value === ".") {
      // Decimal point
      if (!newValue.includes(".")) {
        newValue = newValue + ".";
      }
    } else {
      // Number
      if (newValue === "0" && value !== ".") {
        newValue = value;
      } else {
        // Limit to 2 decimal places
        const parts = newValue.split(".");
        if (parts[1] && parts[1].length >= 2) {
          return;
        }
        newValue = newValue + value;
      }
    }

    // No cap - just validate it's a valid number
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue) || newValue === "0." || newValue.endsWith(".")) {
      setBuyAmount(newValue);
    }
  };

  const handleCreate = async () => {
    // Use IPFS URL if we have a hash, otherwise use direct URL
    const finalImageUrl = ipfsHash ? getIPFSUrl(ipfsHash) : imageUrl;
    let metadataUrl = finalImageUrl; // Default to image URL for backwards compatibility
    
    console.log("handleCreate called with:", {
      name,
      symbol,
      imageUrl: finalImageUrl,
      ipfsHash,
      buyAmount,
    });

    const buyAmountNum = parseFloat(buyAmount);

    // Check validation
    if (!name || !symbol || (!imageUrl && !ipfsHash) || buyAmountNum < 1) {
      console.log("Validation failed:", {
        hasName: !!name,
        hasSymbol: !!symbol,
        hasImageUrl: !!imageUrl,
        hasIpfsHash: !!ipfsHash,
        buyAmountNum,
        isValidAmount: buyAmountNum >= 1,
      });
      toast.error(
        "Please fill in all fields and set a buy amount of at least 1 USDC",
      );
      return;
    }

    if (!walletClient || !publicClient || !address) {
      console.log("Wallet not ready:", {
        hasWalletClient: !!walletClient,
        hasPublicClient: !!publicClient,
        hasAddress: !!address,
      });
      toast.error("Please connect your wallet");
      return;
    }

    setIsCreating(true);

    try {
      // Upload metadata to IPFS if we have a description or structured data
      if (description || ipfsHash) {
        toast.info("Uploading metadata to IPFS...");
        
        const metadata: BoardMetadata = {
          name,
          symbol,
          description: description || undefined,
          image: finalImageUrl,
          attributes: [
            {
              trait_type: "Creator",
              value: address || ""
            },
            {
              trait_type: "Created",
              value: new Date().toISOString()
            }
          ]
        };
        
        try {
          const metadataHash = await uploadBoardMetadata(metadata);
          metadataUrl = getIPFSUrl(metadataHash);
          console.log("Metadata uploaded:", metadataUrl);
        } catch (metadataError) {
          console.error("Metadata upload failed, using image URL directly:", metadataError);
          // Fall back to using image URL directly if metadata upload fails
        }
      }

      // Ensure we're on the correct chain
      if (chain?.id !== baseSepolia.id) {
        try {
          await switchChain({ chainId: baseSepolia.id });
          // Wait a moment for the chain switch to complete
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (switchError: any) {
          if (switchError?.code === 4902) {
            toast.error("Please add Base Sepolia to your wallet");
          } else {
            toast.error("Please switch to Base Sepolia network");
          }
          setIsCreating(false);
          return;
        }
      }

      const buyAmountInUsdc = parseUnits(buyAmount, USDC_DECIMALS);

      // Prepare bundled transaction calls (matching useTokenTransaction pattern)
      const sendCallsData = [];

      // Add USDC approval if there's a buy amount
      if (buyAmountNum > 0) {
        sendCallsData.push({
          to: USDC_ADDRESS as Address,
          value: "0x0" as const,
          data: encodeFunctionData({
            abi: USDC_ABI,
            functionName: "approve",
            args: [ROUTER_ADDRESS as Address, buyAmountInUsdc],
          }),
        });
      }

      // Add createToken call with amountQuoteIn (handles initial buy internally)
      sendCallsData.push({
        to: ROUTER_ADDRESS as Address,
        value: "0x0" as const,
        data: encodeFunctionData({
          abi: ROUTER_ABI,
          functionName: "createToken",
          args: [
            name,
            symbol,
            metadataUrl, // Now passing metadata URL instead of just image URL
            false, // isModerated
            buyAmountInUsdc, // amountQuoteIn - the contract handles the buy internally!
          ],
        }),
      });

      // Try bundled transaction using wallet_sendCalls
      try {
        toast.info("Creating board...");

        // Execute bundled transaction (exactly like useTokenTransaction)
        const result = await walletClient.request({
          method: "wallet_sendCalls" as "wallet_sendCalls",
          params: [
            {
              version: "2.0.0",
              from: address,
              chainId: numberToHex(baseSepolia.id),
              atomicRequired: true,
              calls: sendCallsData,
            },
          ],
        });

        // Consider request submission as success for UX; wallets may not return a tx hash here
        toast.success(`Board ${symbol} created successfully!`);
        // Capture created values for the success modal before clearing inputs
        setCreatedMeta({ name, symbol, imageUrl: finalImageUrl });
        setIsCreating(false);
        setIsCreated(true);
        setShowSuccessModal(true);
        // Clear form inputs to avoid accidental duplicate attempts
        setName("");
        setSymbol("");
        setImageUrl("");
        setIpfsHash("");
        setBuyAmount("0");
        return;
      } catch (sendCallsError: any) {
        // If user rejected, don't fall back
        if (sendCallsError?.code === 4001) {
          toast.error("Transaction cancelled");
          setIsCreating(false);
          return;
        }
        // Hard error for batch path; do not attempt a sequential fallback
        console.error("Batch create failed:", sendCallsError);
        toast.error(
          typeof sendCallsError?.message === "string"
            ? sendCallsError.message
            : "Batch transaction failed",
        );
        setIsCreating(false);
        return;
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create board";
      console.error("Board creation error:", err);
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const isValid =
    name && symbol && (imageUrl || ipfsHash) && !imageError && parseFloat(buyAmount) >= 1;

  // Format number with commas for display
  const formatWithCommas = (value: string) => {
    const parts = value.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  // Handle image preview
  useEffect(() => {
    if (imageUrl) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [imageUrl]);

  // Ensure portals can mount on client only
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col max-w-md mx-auto w-full pwa-safe-top ios-standalone-top">
      {/* Success Modal (portal to escape bottom nav stacking) */}
      {showSuccessModal &&
        isMounted &&
        createPortal(
          <div className="fixed inset-0 bg-black z-[100000]">
            <div className="absolute inset-0 bg-black" />
            <div className="relative w-full max-w-md mx-auto h-full flex flex-col">
              {/* Header with close (top-left) */}
              <div className="px-4 pt-4">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="hover:opacity-80 transition-opacity text-gray-300"
                  aria-label="Close"
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
              <div className="px-6 mt-6 flex flex-col items-center text-center">
                <div className="text-sm text-gray-400 mb-2">
                  Congrats — you created a new board
                </div>
                <div className="text-5xl font-extrabold tracking-tight text-white mb-1">
                  {createdMeta.symbol}
                </div>
                <div className="text-lg text-gray-300 mb-6">
                  {createdMeta.name}
                </div>
                {createdMeta.imageUrl && (
                  <div className="w-40 h-40 rounded-2xl overflow-hidden bg-gray-900 shadow-lg mb-8">
                    <img
                      src={createdMeta.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Bottom CTA */}
              <div
                className="mt-auto p-4"
                style={{
                  paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)",
                }}
              >
                <button
                  onClick={() => {
                    try {
                      localStorage.setItem("profileActiveTab", "boards");
                    } catch {}
                    setShowSuccessModal(false);
                    setActiveTab?.("profile");
                  }}
                  className="w-full py-4 rounded-2xl font-semibold text-lg bg-[#0052FF] text-white hover:bg-blue-600 transition-colors shadow-lg"
                >
                  See it in your profile
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {/* Scrollable content section */}
      <div className="flex-1 overflow-y-auto px-4 pt-16">
        {/* Name, Symbol and Image Upload row */}
        <div className="flex items-start gap-4">
          <div className="flex-1">
            {/* Name */}
            <div className="mb-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full bg-transparent text-lg placeholder:text-gray-600 focus:outline-none focus:placeholder:text-gray-500 transition-colors"
                maxLength={26}
              />
            </div>

            {/* Symbol - Larger than name */}
            <div>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="SYMBOL"
                className="w-full bg-transparent text-5xl font-bold placeholder:text-gray-600 focus:outline-none focus:placeholder:text-gray-500 transition-colors"
                maxLength={8}
              />
            </div>
          </div>

          {/* Image Upload - Top right corner */}
          <ImageUploadCompact
            onUploadComplete={(hash) => {
              setIpfsHash(hash);
              setImageUrl(getIPFSUrl(hash));
            }}
            currentImage={imageUrl}
          />
        </div>

        {/* Description */}
        <div className="mt-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description..."
            className="w-full bg-transparent text-base text-white placeholder:text-gray-600 focus:outline-none focus:placeholder:text-gray-500 transition-colors resize-none"
            rows={3}
            maxLength={280}
          />
        </div>

        {/* Buy Amount Section */}
        <div className="mt-8">
          <div className="mb-2">
            <span className="text-sm text-[#0052FF] font-medium">
              Initial buy
            </span>
          </div>
          <div className="text-5xl font-bold text-white mb-2">
            {buyAmount === "0" || buyAmount === "0."
              ? "0"
              : formatWithCommas(buyAmount)}
          </div>
          <div className="text-sm text-gray-500">
            {isLoadingBalance
              ? "Loading balance..."
              : isConnected
                ? `${formatCurrency(userBalance, 2, false)} available • $1 minimum`
                : "Connect wallet to see balance"}
          </div>
        </div>
      </div>

      {/* Fixed bottom section - positioned at bottom */}
      <div className="bg-black pb-20">
        {/* Create Button */}
        <div className="px-4 mb-2">
          <button
            onClick={handleCreate}
            disabled={!isValid || isCreating}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
              isValid && !isCreating
                ? "bg-[#0052FF] text-white hover:bg-blue-600 active:scale-[0.98]"
                : "bg-gray-900 text-gray-600 cursor-not-allowed"
            }`}
          >
            {isCreating ? "Creating..." : "Create board"}
          </button>
        </div>

        {/* Number Pad - compact to fit screen */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberPad(num.toString())}
                className="h-10 text-xl font-medium text-[#0052FF] hover:bg-gray-900 active:bg-gray-800 rounded-lg transition-all"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleNumberPad(".")}
              className="h-10 text-xl font-medium text-[#0052FF] hover:bg-gray-900 active:bg-gray-800 rounded-lg transition-all"
            >
              .
            </button>
            <button
              onClick={() => handleNumberPad("0")}
              className="h-10 text-xl font-medium text-[#0052FF] hover:bg-gray-900 active:bg-gray-800 rounded-lg transition-all"
            >
              0
            </button>
            <button
              onClick={() => handleNumberPad("<")}
              className="h-9 text-xl font-medium text-[#0052FF] hover:bg-gray-900 active:bg-gray-800 rounded-lg transition-all flex items-center justify-center"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
