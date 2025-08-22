"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useWalletClient, usePublicClient } from "wagmi";
import { formatUnits, parseUnits, encodeFunctionData, parseEventLogs } from "viem";
import { Icon } from "../../ui";
import { useEnforceBaseWallet } from "../../../hooks/useBaseAccount";
import { formatCurrency } from "@/lib/utils/formatters";
import { USDC_ADDRESS, USDC_ABI, USDC_DECIMALS, ROUTER_ADDRESS, ROUTER_ABI } from "@/lib/constants";
import { toast } from 'sonner';
import type { CreateProps } from "./Create.types";

export function Create({ setActiveTab }: CreateProps) {
  const { address, isConnected } = useAccount();
  const { isValidConnection } = useEnforceBaseWallet();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [buyAmount, setBuyAmount] = useState("0");
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Get user's USDC balance directly from the USDC contract
  const { data: usdcBalance, isLoading: isLoadingBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Refetch every 5 seconds
    }
  });

  const userBalance = usdcBalance 
    ? parseFloat(formatUnits(usdcBalance, USDC_DECIMALS))
    : 0;

  const handleNumberPad = (value: string) => {
    let newValue = buyAmount;
    
    if (value === '<') {
      // Backspace
      if (newValue.length > 1) {
        newValue = newValue.slice(0, -1);
      } else {
        newValue = '0';
      }
    } else if (value === '.') {
      // Decimal point
      if (!newValue.includes('.')) {
        newValue = newValue + '.';
      }
    } else {
      // Number
      if (newValue === '0' && value !== '.') {
        newValue = value;
      } else {
        // Limit to 2 decimal places
        const parts = newValue.split('.');
        if (parts[1] && parts[1].length >= 2) {
          return;
        }
        newValue = newValue + value;
      }
    }
    
    // No cap - just validate it's a valid number
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue) || newValue === '0.' || newValue.endsWith('.')) {
      setBuyAmount(newValue);
    }
  };

  const handleCreate = async () => {
    const buyAmountNum = parseFloat(buyAmount);
    if (!name || !symbol || !imageUrl || buyAmountNum < 1 || !walletClient || !publicClient || !address) {
      return;
    }

    setIsCreating(true);
    
    try {
      const buyAmountInUsdc = parseUnits(buyAmount, USDC_DECIMALS);
      
      // Prepare batch transaction with Coinbase Smart Wallet
      const calls = [];
      
      // 1. Approve USDC spending
      if (buyAmountNum > 0) {
        calls.push({
          to: USDC_ADDRESS,
          data: encodeFunctionData({
            abi: USDC_ABI,
            functionName: 'approve',
            args: [ROUTER_ADDRESS, buyAmountInUsdc]
          }),
          value: BigInt(0)
        });
      }
      
      // 2. Create token
      calls.push({
        to: ROUTER_ADDRESS,
        data: encodeFunctionData({
          abi: ROUTER_ABI,
          functionName: 'createToken',
          args: [name, symbol, imageUrl, false] // isModerated = false
        }),
        value: BigInt(0)
      });
      
      // Execute bundled transaction
      
      // For Coinbase Smart Wallet, we can send multiple calls in one transaction
      const txHash = await walletClient.sendTransaction({
        account: address,
        calls, // Smart Wallet supports bundled calls
        chain: walletClient.chain,
      });
      
      toast.info('Transaction submitted, waiting for confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      });
      
      if (receipt.status === 'success') {
        // Parse events to get the token address
        const events = parseEventLogs({
          abi: ROUTER_ABI,
          logs: receipt.logs,
          eventName: 'Router__TokenCreated'
        });
        
        const tokenAddress = events[0]?.args?.token;
        
        if (tokenAddress && buyAmountNum > 0) {
          // Execute the initial buy as a separate transaction
          
          const buyHash = await walletClient.writeContract({
            address: ROUTER_ADDRESS,
            abi: ROUTER_ABI,
            functionName: 'buy',
            args: [
              tokenAddress,
              address, // affiliate (use self)
              buyAmountInUsdc,
              0n, // minAmountTokenOut (0 for no slippage protection)
              BigInt(Math.floor(Date.now() / 1000) + 300), // expireTimestamp (5 minutes)
            ],
            account: address,
            chain: walletClient.chain,
          });
          
          await publicClient.waitForTransactionReceipt({
            hash: buyHash,
            confirmations: 1,
          });
        }
        
        toast.success(`Token ${symbol} created successfully!`);
        
        // Reset form
        setName("");
        setSymbol("");
        setImageUrl("");
        setBuyAmount("0");
        
        // Navigate to home
        setActiveTab?.("home");
      } else {
        throw new Error('Transaction failed');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create token';
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const isValid = name && symbol && imageUrl && !imageError && parseFloat(buyAmount) >= 1;

  // Format number with commas for display
  const formatWithCommas = (value: string) => {
    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // Handle image preview
  useEffect(() => {
    if (imageUrl) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [imageUrl]);

  return (
    <div className="fixed inset-0 bottom-20 bg-black text-white flex flex-col max-w-md mx-auto w-full">
      {/* Top section - no scroll */}
      <div className="flex-1 flex flex-col px-4 pt-6 overflow-hidden">
        {/* Name, Symbol and Preview row */}
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
                maxLength={20}
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
                maxLength={10}
              />
            </div>
          </div>
          
          {/* Image Preview - No box until image is added */}
          {imageUrl && !imageError && (
            <div className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0">
              <img 
                src={imageUrl} 
                alt="Preview"
                className="w-full h-full object-cover"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Image URL with more spacing */}
        <div className="mt-8 mb-16">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image URL"
            className="w-full bg-transparent border-b border-gray-800 pb-2 text-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
          />
        </div>

        {/* Buy Amount Section */}
        <div>
          <div className="mb-2">
            <span className="text-sm text-[#0052FF] font-medium">Initial buy</span>
          </div>
          <div className="text-5xl font-bold text-white mb-2">
            {buyAmount === '0' || buyAmount === '0.' ? '0' : formatWithCommas(buyAmount)}
          </div>
          <div className="text-sm text-gray-500">
            {isLoadingBalance 
              ? "Loading balance..." 
              : isConnected 
                ? `${formatCurrency(userBalance, 2, false)} available • $1 minimum`
                : "Connect wallet to see balance"
            }
          </div>
        </div>
      </div>

      {/* Fixed bottom section - positioned at bottom */}
      <div className="bg-black">
        {/* Create Button */}
        <div className="px-4 mb-1">
          <button
            onClick={handleCreate}
            disabled={!isValid || isCreating}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
              isValid && !isCreating
                ? 'bg-[#0052FF] text-white hover:bg-blue-600 active:scale-[0.98]'
                : 'bg-gray-900 text-gray-600 cursor-not-allowed'
            }`}
          >
            {isCreating ? 'Creating...' : 'Create Token'}
          </button>
        </div>

        {/* Number Pad - compact to fit screen */}
        <div className="px-4 pb-0">
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberPad(num.toString())}
                className="h-9 text-xl font-medium text-[#0052FF] hover:bg-gray-900 active:bg-gray-800 rounded-lg transition-all"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleNumberPad('.')}
              className="h-9 text-xl font-medium text-[#0052FF] hover:bg-gray-900 active:bg-gray-800 rounded-lg transition-all"
            >
              .
            </button>
            <button
              onClick={() => handleNumberPad('0')}
              className="h-9 text-xl font-medium text-[#0052FF] hover:bg-gray-900 active:bg-gray-800 rounded-lg transition-all"
            >
              0
            </button>
            <button
              onClick={() => handleNumberPad('<')}
              className="h-9 text-xl font-medium text-[#0052FF] hover:bg-gray-900 active:bg-gray-800 rounded-lg transition-all flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}