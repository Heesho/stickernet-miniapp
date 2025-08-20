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
  const [inputValue, setInputValue] = useState("0.00");
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
  const estimatedUSDC = parseFloat(inputValue) > 0 && usdcAmtOut 
    ? parseFloat(usdcAmtOut).toFixed(2) 
    : "0.00";

  const handleNumberPad = (value: string) => {
    if (value === "<") {
      const newValue = inputValue.slice(0, -1) || "0";
      setInputValue(newValue === "" ? "0.00" : newValue);
    } else if (value === ".") {
      if (!inputValue.includes(".")) {
        setInputValue(inputValue + ".");
      }
    } else {
      if (inputValue === "0.00" || inputValue === "0") {
        setInputValue(value);
      } else {
        setInputValue(inputValue + value);
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
                {inputValue}
              </div>
              <div className="text-gray-600 text-xs">
                Available: {isLoadingBalance ? "Loading..." : `${parseFloat(userTokenBalance).toFixed(2)} ${tokenSymbol.toUpperCase()}`}
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
                  `$${estimatedUSDC}`
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
                Insufficient balance. You have {parseFloat(userTokenBalance).toFixed(2)} {tokenSymbol.toUpperCase()}
              </div>
            )}

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleNumberPad("1")}
              className="py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
              style={{ color: themeColor }}
            >
              1
            </button>
            <button
              onClick={() => handleNumberPad("2")}
              className="py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
              style={{ color: themeColor }}
            >
              2
            </button>
            <button
              onClick={() => handleNumberPad("3")}
              className="py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
              style={{ color: themeColor }}
            >
              3
            </button>

            <button
              onClick={() => handleNumberPad("4")}
              className="py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
              style={{ color: themeColor }}
            >
              4
            </button>
            <button
              onClick={() => handleNumberPad("5")}
              className="py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
              style={{ color: themeColor }}
            >
              5
            </button>
            <button
              onClick={() => handleNumberPad("6")}
              className="py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
              style={{ color: themeColor }}
            >
              6
            </button>

            <button
              onClick={() => handleNumberPad("7")}
              className="py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
              style={{ color: themeColor }}
            >
              7
            </button>
            <button
              onClick={() => handleNumberPad("8")}
              className="py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
              style={{ color: themeColor }}
            >
              8
            </button>
            <button
              onClick={() => handleNumberPad("9")}
              className="py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
              style={{ color: themeColor }}
            >
              9
            </button>

            <button
              onClick={() => handleNumberPad(".")}
              className="py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
              style={{ color: themeColor }}
            >
              .
            </button>
            <button
              onClick={() => handleNumberPad("0")}
              className="py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
              style={{ color: themeColor }}
            >
              0
            </button>
            <button
              onClick={() => handleNumberPad("<")}
              className="py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
              style={{ color: themeColor }}
            >
              &lt;
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}