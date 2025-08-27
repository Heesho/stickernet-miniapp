"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { useTokenData } from "@/app/hooks/useMulticall";
import { baseSepolia } from "wagmi/chains";
import { TOKEN_ABI, USDC_DECIMALS } from "@/lib/constants";
import {
  formatNumber,
  formatCurrency,
} from "@/lib/utils/formatters";

interface BorrowPageProps {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  onClose: () => void;
  themeColor?: string;
  onTransactionSuccess?: () => void;
}

export function BorrowPage({
  tokenAddress,
  tokenSymbol,
  tokenName,
  onClose,
  themeColor = "#0052FF",
  onTransactionSuccess,
}: BorrowPageProps) {
  const [inputValue, setInputValue] = useState("");
  const [displayValue, setDisplayValue] = useState("$0");
  const { address } = useAccount();

  // Get user's credit from token data
  const { tokenData, isLoading: isLoadingBalance } = useTokenData({
    tokenAddress: tokenAddress as `0x${string}`,
    account: address,
    enabled: !!tokenAddress && !!address,
  });

  // Get the user's available credit (6 decimals for USDC)
  const userCredit = tokenData?.accountCredit
    ? formatUnits(tokenData.accountCredit, USDC_DECIMALS)
    : "0";

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
    // Format display value without forcing decimals
    if (newValue === "" || newValue === ".") {
      setDisplayValue("$0");
    } else {
      // Just add commas for thousands, don't force decimal places
      const parts = newValue.split('.');
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const formattedValue = parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
      setDisplayValue("$" + formattedValue);
    }
  };

  // Transaction state
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txError, setTxError] = useState<Error | null>(null);

  // Borrow transaction using writeContract
  const {
    writeContract: borrowWrite,
    data: borrowHash,
    isPending: isBorrowing,
    error: borrowError,
    reset: resetBorrow,
  } = useWriteContract();

  const { 
    isLoading: isBorrowConfirming, 
    isSuccess: isBorrowConfirmed,
  } = useWaitForTransactionReceipt({
    hash: borrowHash,
  });

  // Update status when transaction is pending
  useEffect(() => {
    if (isBorrowing || isBorrowConfirming) {
      setTxStatus("pending");
    }
  }, [isBorrowing, isBorrowConfirming]);

  const handleClose = () => {
    // Don't allow closing during transaction
    if (txStatus !== "pending") {
      setTxStatus("idle");
      setTxError(null);
      resetBorrow();
      onClose();
    }
  };

  const handleBorrow = async () => {
    if (parseFloat(inputValue) <= 0) {
      return;
    }

    // Check if user has enough credit
    const inputAmount = parseFloat(inputValue);
    const availableCredit = parseFloat(userCredit);

    if (inputAmount > availableCredit) {
      console.error("Insufficient credit:", {
        requested: inputAmount,
        available: availableCredit,
      });
      return;
    }

    try {
      // Convert input value to USDC units (6 decimals)
      const borrowAmount = parseUnits(inputValue, USDC_DECIMALS);
      
      console.log("Borrow transaction details:", {
        tokenAddress,
        borrowAmount: borrowAmount.toString(),
        borrowAmountFormatted: inputValue,
      });

      // Execute borrow transaction directly on token contract
      // to: user's address (where to send the borrowed USDC)
      // quoteRaw: amount in USDC units (6 decimals)
      await borrowWrite({
        address: tokenAddress as `0x${string}`, // Token contract address
        abi: TOKEN_ABI,
        functionName: "borrow",
        args: [
          address as `0x${string}`, // to: user's address
          borrowAmount, // quoteRaw: amount in USDC units (6 decimals)
        ],
        chainId: baseSepolia.id,
      });
      
      console.log("Borrow transaction sent successfully");
      // Set success immediately like RepayPage does
      setTxStatus("success");
      
      // Trigger refresh
      onTransactionSuccess?.();
      
      // Close after delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Borrow transaction failed:", error);
      setTxStatus("error");
      setTxError(error instanceof Error ? error : new Error("Transaction failed"));
    }
  };


  const isTxLoading = txStatus === "pending";

  // Use portal to render outside of parent component hierarchy
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black z-[9999]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="absolute inset-0 bg-black" />
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
            Borrow {tokenSymbol.toUpperCase()} credit
          </h1>

          <div className="space-y-4">
            <div>
              <label
                className="text-sm mb-2 block"
                style={{ color: themeColor }}
              >
                Get
              </label>
              <div className="text-white text-3xl font-medium mb-1 tracking-wide">
                {displayValue}
              </div>
              <button 
                onClick={() => {
                  if (userCredit && parseFloat(userCredit) > 0) {
                    const creditStr = userCredit.toString();
                    setInputValue(creditStr);
                    // Format without forcing decimals
                    const parts = creditStr.split('.');
                    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    const formattedValue = parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
                    setDisplayValue("$" + formattedValue);
                  }
                }}
                className="text-gray-600 text-xs hover:text-white transition-colors cursor-pointer"
              >
                {isLoadingBalance
                  ? "Loading..."
                  : `${formatCurrency(userCredit, 2, false)} available`}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end pb-16">
          <div className="px-4">
            <button
              onClick={handleBorrow}
              disabled={
                parseFloat(inputValue) <= 0 ||
                parseFloat(inputValue) > parseFloat(userCredit) ||
                isTxLoading
              }
              className={`w-full disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-2.5 rounded-xl transition-colors mb-3 flex items-center justify-center gap-2 focus:outline-none hover:opacity-90`}
              style={{
                backgroundColor:
                  parseFloat(inputValue) <= 0 ||
                  parseFloat(inputValue) > parseFloat(userCredit) ||
                  isTxLoading
                    ? "#374151" // gray when disabled
                    : txStatus === "success"
                      ? "#10b981" // green on success
                      : txError
                        ? "#ef4444" // red on error
                        : themeColor, // theme color when normal
              }}
            >
              {isTxLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : txStatus === "success" ? (
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
                "Borrow"
              )}
            </button>

            {/* Credit warning */}
            {parseFloat(inputValue) > parseFloat(userCredit) &&
              parseFloat(inputValue) > 0 && (
                <div className="text-yellow-500 text-xs text-center mb-2">
                  Insufficient credit. You have {formatCurrency(userCredit)} available
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
                <svg
                  className="w-6 h-6"
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
    </div>,
    document.body,
  );
}