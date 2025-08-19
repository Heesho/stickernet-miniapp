"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../../ui";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useTokenData } from "@/app/hooks/useMulticall";
import { useDebouncedBuyQuote } from "@/app/hooks/useBuyQuote";
import { useSendCallsBuyToken } from "@/app/hooks/useSendCallsBuyToken";
import { USDC_DECIMALS } from "@/lib/constants";

interface BuyPageProps {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenPrice: string;
  onClose: () => void;
}

export function BuyPage({
  tokenAddress,
  tokenSymbol,
  tokenName,
  tokenPrice,
  onClose
}: BuyPageProps) {
  const [inputValue, setInputValue] = useState("0.00");
  const { address } = useAccount();

  // Get user's USDC balance from token data
  const { tokenData, isLoading: isLoadingBalance } = useTokenData({
    tokenAddress,
    account: address,
    enabled: !!tokenAddress && !!address
  });

  // Get the user's USDC balance
  const userBalance = tokenData?.accountQuoteBalance 
    ? formatUnits(tokenData.accountQuoteBalance, USDC_DECIMALS) 
    : "0";

  // Get buy quote with debouncing
  const { 
    tokenAmtOut, 
    rawTokenAmtOut,
    minTokenAmtOut,
    autoMinTokenAmtOut,
    slippage,
    isLoading: isLoadingQuote 
  } = useDebouncedBuyQuote({
    tokenAddress,
    usdcAmount: inputValue,
    enabled: !!tokenAddress && parseFloat(inputValue) > 0,
    delay: 300
  });

  // Format the estimated tokens - use quote if available, otherwise show 0
  const estimatedTokens = parseFloat(inputValue) > 0 && tokenAmtOut 
    ? parseFloat(tokenAmtOut).toFixed(2) 
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

  // Hook for executing the actual buy transaction
  const {
    executeBuy,
    status: txStatus,
    isLoading: isTxLoading,
    isSuccess: isTxSuccess,
    error: txError,
    reset: resetTx
  } = useSendCallsBuyToken();

  const handleClose = () => {
    // Don't allow closing during transaction
    if (!isTxLoading) {
      resetTx();
      onClose();
    }
  };

  const handleBuy = async () => {
    if (parseFloat(inputValue) <= 0 || !autoMinTokenAmtOut) {
      return;
    }

    // Check if user has enough balance
    const inputAmount = parseFloat(inputValue);
    const availableBalance = parseFloat(userBalance);
    
    if (inputAmount > availableBalance) {
      console.error('Insufficient USDC balance:', {
        requested: inputAmount,
        available: availableBalance
      });
      return;
    }

    console.log('Executing buy with params:', {
      tokenAddress,
      usdcAmount: inputValue,
      minTokenAmountOut: autoMinTokenAmtOut?.toString(), // Log the actual value
      minTokenAmountOutFormatted: autoMinTokenAmtOut ? formatUnits(autoMinTokenAmtOut, 18) : '0'
    });
    
    // Execute the buy - following the exact pattern from CurateConfirmation
    await executeBuy({
      tokenAddress,
      usdcAmount: inputValue,
      minTokenAmountOut: autoMinTokenAmtOut
    });
  };

  // Handle successful transaction - EXACTLY like steal page (CurateConfirmation)
  useEffect(() => {
    if (txStatus === 'success') {
      // Wait a moment to show success state, then close
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [txStatus, onClose]);

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
              className="text-[#0052FF] hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              <X size={24} />
            </button>
            <div className="flex-1" />
          </div>

          <h1 className="text-white text-2xl font-semibold mb-4 text-left">
            Buy {tokenSymbol.toUpperCase()}
          </h1>

          <div className="space-y-4">
            <div>
              <label className="text-[#0052FF] text-sm mb-2 block">
                Pay
              </label>
              <div className="text-white text-3xl font-medium mb-1 tracking-wide">
                {inputValue}
              </div>
              <div className="text-gray-600 text-xs">
                Available: {isLoadingBalance ? "Loading..." : `${parseFloat(userBalance).toFixed(2)} USDC`}
              </div>
            </div>

            <div>
              <label className="text-[#0052FF] text-sm mb-2 block">
                Get
              </label>
              <div className="text-white text-3xl font-medium tracking-wide">
                {isLoadingQuote && parseFloat(inputValue) > 0 ? (
                  <span className="text-gray-500">Calculating...</span>
                ) : (
                  estimatedTokens
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end pb-16">
          <div className="px-4">
            <Button
              onClick={handleBuy}
              disabled={
                parseFloat(inputValue) <= 0 || 
                parseFloat(inputValue) > parseFloat(userBalance) ||
                isTxLoading ||
                !autoMinTokenAmtOut
              }
              className={`w-full ${
                txStatus === 'success'
                  ? 'bg-green-500 hover:bg-green-600' 
                  : txError 
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-[#0052FF] hover:bg-[#0052FF]/90'
              } disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-3 rounded-xl text-lg transition-colors mb-3 flex items-center justify-center gap-2 focus:outline-none`}
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
                'Buy'
              )}
            </Button>
            
            {/* Balance warning */}
            {parseFloat(inputValue) > parseFloat(userBalance) && parseFloat(inputValue) > 0 && (
              <div className="text-yellow-500 text-xs text-center mb-2">
                Insufficient balance. You have {parseFloat(userBalance).toFixed(2)} USDC
              </div>
            )}

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleNumberPad("1")}
              className="text-[#0052FF] py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
            >
              1
            </button>
            <button
              onClick={() => handleNumberPad("2")}
              className="text-[#0052FF] py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
            >
              2
            </button>
            <button
              onClick={() => handleNumberPad("3")}
              className="text-[#0052FF] py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
            >
              3
            </button>

            <button
              onClick={() => handleNumberPad("4")}
              className="text-[#0052FF] py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
            >
              4
            </button>
            <button
              onClick={() => handleNumberPad("5")}
              className="text-[#0052FF] py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
            >
              5
            </button>
            <button
              onClick={() => handleNumberPad("6")}
              className="text-[#0052FF] py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
            >
              6
            </button>

            <button
              onClick={() => handleNumberPad("7")}
              className="text-[#0052FF] py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
            >
              7
            </button>
            <button
              onClick={() => handleNumberPad("8")}
              className="text-[#0052FF] py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
            >
              8
            </button>
            <button
              onClick={() => handleNumberPad("9")}
              className="text-[#0052FF] py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
            >
              9
            </button>

            <button
              onClick={() => handleNumberPad(".")}
              className="text-[#0052FF] py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
            >
              .
            </button>
            <button
              onClick={() => handleNumberPad("0")}
              className="text-[#0052FF] py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
            >
              0
            </button>
            <button
              onClick={() => handleNumberPad("<")}
              className="text-[#0052FF] py-2.5 text-xl font-medium active:opacity-70 transition-opacity"
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