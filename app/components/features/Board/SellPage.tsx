"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../../ui";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useTokenData } from "@/app/hooks/useMulticall";
import { useDebouncedSellQuote } from "@/app/hooks/useSellQuote";
import { useSendCallsSellToken } from "@/app/hooks/useSendCallsSellToken";
import { formatNumber, formatCurrency, formatTokenAmount } from "@/lib/utils/formatters";

interface SellPageProps {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenPrice: string;
  onClose: () => void;
  themeColor?: string;
  onTransactionSuccess?: () => void;
}

export function SellPage({
  tokenAddress,
  tokenSymbol,
  tokenName,
  tokenPrice,
  onClose,
  themeColor = '#0052FF',
  onTransactionSuccess
}: SellPageProps) {
  const [inputValue, setInputValue] = useState("");
  const [displayValue, setDisplayValue] = useState("0");
  const { address } = useAccount();

  // Get user's token balance from token data
  const { tokenData, isLoading: isLoadingBalance } = useTokenData({
    tokenAddress,
    account: address,
    enabled: !!tokenAddress && !!address
  });

  // Get the user's token balance (18 decimals)
  const userTokenBalance = tokenData?.accountTokenBalance 
    ? formatUnits(tokenData.accountTokenBalance, 18) 
    : "0";

  // Get sell quote with debouncing
  const { 
    usdcAmtOut, 
    rawUsdcAmtOut,
    minUsdcAmtOut,
    autoMinUsdcAmtOut,
    slippage,
    isLoading: isLoadingQuote 
  } = useDebouncedSellQuote({
    tokenAddress,
    tokenAmount: inputValue,
    enabled: !!tokenAddress && parseFloat(inputValue) > 0,
    delay: 300
  });

  // Format the estimated USDC - use quote if available, otherwise show 0
  // Don't use compact format on transaction pages
  const estimatedUSDC = parseFloat(inputValue) > 0 && usdcAmtOut 
    ? formatCurrency(usdcAmtOut, 2, false)
    : formatCurrency(0, 2, false);

  const handleNumberPad = (value: string) => {
    let newValue = inputValue;
    
    if (value === "<") {
      newValue = inputValue.slice(0, -1) || "";
    } else if (value === ".") {
      if (!inputValue.includes(".")) {
        newValue = inputValue + ".";
      }
    } else {
      if (inputValue === "0" || inputValue === "") {
        newValue = value;
      } else {
        newValue = inputValue + value;
      }
    }
    
    setInputValue(newValue);
    // Format display value
    if (newValue === "" || newValue === ".") {
      setDisplayValue("0");
    } else {
      const num = parseFloat(newValue);
      if (!isNaN(num)) {
        setDisplayValue(formatNumber(num, 2, true, false));  // No compact format on transaction pages
      } else {
        setDisplayValue(newValue);
      }
    }
  };

  // Hook for executing the actual sell transaction
  const {
    executeSell,
    status: txStatus,
    isLoading: isTxLoading,
    isSuccess: isTxSuccess,
    error: txError,
    reset: resetTx
  } = useSendCallsSellToken();

  const handleClose = () => {
    // Don't allow closing during transaction
    if (!isTxLoading) {
      resetTx();
      onClose();
    }
  };

  const handleSell = async () => {
    if (parseFloat(inputValue) <= 0 || !autoMinUsdcAmtOut) {
      return;
    }

    // Check if user has enough balance
    const inputAmount = parseFloat(inputValue);
    const availableBalance = parseFloat(userTokenBalance);
    
    if (inputAmount > availableBalance) {
      console.error('Insufficient token balance:', {
        requested: inputAmount,
        available: availableBalance
      });
      return;
    }

    console.log('Executing sell with params:', {
      tokenAddress,
      tokenAmount: inputValue,
      minUsdcAmountOut: autoMinUsdcAmtOut?.toString(),
      minUsdcAmountOutFormatted: autoMinUsdcAmtOut ? formatUnits(autoMinUsdcAmtOut, 6) : '0'
    });
    
    // Execute the sell - following the exact pattern from BuyPage
    await executeSell({
      tokenAddress,
      tokenAmount: inputValue,
      minUsdcAmountOut: autoMinUsdcAmtOut
    });
  };

  // Handle successful transaction - EXACTLY like buy page
  useEffect(() => {
    if (txStatus === 'success') {
      // Trigger refresh of data
      onTransactionSuccess?.();
      
      // Wait a moment to show success state, then close
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [txStatus, onClose, onTransactionSuccess]);

  // Use portal to render outside of parent component hierarchy
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black z-[9999]">
      <div className="absolute inset-0 bg-black" /> {/* Full background overlay */}
      <div className="relative w-full max-w-md mx-auto h-full flex flex-col">
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleClose}
              disabled={isTxLoading}
              className="hover:opacity-80 transition-opacity disabled:opacity-50"
              style={{ color: themeColor }}
            >
              <X size={24} />
            </button>
            <div className="flex-1" />
          </div>

          <h1 className="text-white text-2xl font-semibold mb-4 text-left">
            Sell {tokenSymbol.toUpperCase()}
          </h1>

          <div className="space-y-4">
            <div>
              <label className="text-sm mb-2 block" style={{ color: themeColor }}>
                Pay
              </label>
              <div className="text-white text-3xl font-medium mb-1 tracking-wide">
                {displayValue}
              </div>
              <div className="text-gray-600 text-xs">
                Available: {isLoadingBalance ? "Loading..." : formatTokenAmount(userTokenBalance, tokenSymbol.toUpperCase(), undefined, false)}
              </div>
            </div>

            <div>
              <label className="text-sm mb-2 block" style={{ color: themeColor }}>
                Get
              </label>
              <div className="text-white text-3xl font-medium tracking-wide">
                {isLoadingQuote && parseFloat(inputValue) > 0 ? (
                  <span className="text-gray-500">Calculating...</span>
                ) : (
                  estimatedUSDC
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end pb-16">
          <div className="px-4">
            <button
              onClick={handleSell}
              disabled={
                parseFloat(inputValue) <= 0 || 
                parseFloat(inputValue) > parseFloat(userTokenBalance) ||
                isTxLoading ||
                !autoMinUsdcAmtOut
              }
              className={`w-full ${
                txStatus === 'success'
                  ? '' 
                  : txError 
                  ? ''
                  : ''
              } disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-2.5 rounded-xl transition-colors mb-3 flex items-center justify-center gap-2 focus:outline-none hover:opacity-90`}
              style={{
                backgroundColor: 
                  (parseFloat(inputValue) <= 0 || 
                   parseFloat(inputValue) > parseFloat(userTokenBalance) ||
                   isTxLoading ||
                   !autoMinUsdcAmtOut) 
                    ? '#374151' // gray when disabled
                    : txStatus === 'success'
                    ? '#10b981' // green on success
                    : txError
                    ? '#ef4444' // red on error
                    : themeColor // theme color when normal
              }}
            >
              {isTxLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : txStatus === 'success' ? (
                <>
                  <CheckCircle2 size={20} />
                  <span>Success!</span>
                </>
              ) : txError ? (
                <>
                  <AlertCircle size={20} />
                  <span>Try Again</span>
                </>
              ) : (
                'Sell'
              )}
            </button>
            
            {/* Balance warning */}
            {parseFloat(inputValue) > parseFloat(userTokenBalance) && parseFloat(inputValue) > 0 && (
              <div className="text-yellow-500 text-xs text-center mb-2">
                Insufficient balance. You have {formatTokenAmount(userTokenBalance, tokenSymbol.toUpperCase(), undefined, false)}
              </div>
            )}

          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberPad(num.toString())}
                className="h-10 text-2xl font-medium hover:bg-gray-900 active:bg-gray-800 rounded-xl transition-all"
                style={{ color: themeColor }}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleNumberPad(".")}
              className="h-10 text-2xl font-medium hover:bg-gray-900 active:bg-gray-800 rounded-xl transition-all"
              style={{ color: themeColor }}
            >
              .
            </button>
            <button
              onClick={() => handleNumberPad("0")}
              className="h-10 text-2xl font-medium hover:bg-gray-900 active:bg-gray-800 rounded-xl transition-all"
              style={{ color: themeColor }}
            >
              0
            </button>
            <button
              onClick={() => handleNumberPad("<")}
              className="h-10 text-2xl font-medium hover:bg-gray-900 active:bg-gray-800 rounded-xl transition-all flex items-center justify-center"
              style={{ color: themeColor }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}