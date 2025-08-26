"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAccount, useWalletClient } from "wagmi";
import { formatUnits, parseUnits, encodeFunctionData } from "viem";
import { useTokenData } from "@/app/hooks/useMulticall";
import { baseSepolia } from "wagmi/chains";
import { TOKEN_ABI, USDC_ADDRESS, USDC_ABI, USDC_DECIMALS } from "@/lib/constants";
import {
  formatNumber,
  formatCurrency,
} from "@/lib/utils/formatters";

interface RepayPageProps {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  onClose: () => void;
  themeColor?: string;
  onTransactionSuccess?: () => void;
}

export function RepayPage({
  tokenAddress,
  tokenSymbol,
  tokenName,
  onClose,
  themeColor = "#0052FF",
  onTransactionSuccess,
}: RepayPageProps) {
  const [inputValue, setInputValue] = useState("");
  const [displayValue, setDisplayValue] = useState("$0");
  const { address } = useAccount();

  // Get user's debt and USDC balance from token data
  const { tokenData, isLoading: isLoadingBalance } = useTokenData({
    tokenAddress: tokenAddress as `0x${string}`,
    account: address,
    enabled: !!tokenAddress && !!address,
  });

  // Get the user's debt (6 decimals for USDC)
  const userDebt = tokenData?.accountDebt
    ? formatUnits(tokenData.accountDebt, USDC_DECIMALS)
    : "0";

  // Get the user's USDC balance
  const userBalance = tokenData?.accountQuoteBalance
    ? formatUnits(tokenData.accountQuoteBalance, USDC_DECIMALS)
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

  // Get wallet client for sending bundled transactions
  const { data: walletClient } = useWalletClient();

  // Transaction state
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "success" | "error">("idle");
  const [txError, setTxError] = useState<Error | null>(null);

  const handleClose = () => {
    // Don't allow closing during transaction
    if (!isProcessing) {
      setTxStatus("idle");
      setTxError(null);
      onClose();
    }
  };

  const handleRepay = useCallback(async () => {
    if (!walletClient || !address || parseFloat(inputValue) <= 0) {
      return;
    }

    // Check if user has enough balance
    const inputAmount = parseFloat(inputValue);
    const availableBalance = parseFloat(userBalance);
    const debtAmount = parseFloat(userDebt);

    if (inputAmount > availableBalance) {
      console.error("Insufficient USDC balance:", {
        requested: inputAmount,
        available: availableBalance,
      });
      return;
    }

    if (inputAmount > debtAmount) {
      console.error("Cannot repay more than debt:", {
        requested: inputAmount,
        debt: debtAmount,
      });
      return;
    }

    try {
      setIsProcessing(true);
      setTxStatus("idle");
      setTxError(null);

      // Convert input value to USDC units (6 decimals)
      const repayAmount = parseUnits(inputValue, USDC_DECIMALS);
      
      console.log("Repay transaction details:", {
        tokenAddress,
        to: address,
        repayAmount: repayAmount.toString(),
        repayAmountFormatted: inputValue,
      });

      // Build the bundled transaction calls
      const calls = [
        // 1. Approve USDC spending by token contract
        {
          to: USDC_ADDRESS as `0x${string}`,
          data: encodeFunctionData({
            abi: USDC_ABI,
            functionName: "approve",
            args: [tokenAddress as `0x${string}`, repayAmount],
          }),
        },
        // 2. Call repay on token contract
        {
          to: tokenAddress as `0x${string}`,
          data: encodeFunctionData({
            abi: TOKEN_ABI,
            functionName: "repay",
            args: [address as `0x${string}`, repayAmount],
          }),
        },
      ];

      // Send bundled transactions using sendCalls (for Smart Wallets)
      // or fallback to sequential transactions for EOAs
      if ('sendCalls' in walletClient) {
        // Smart Wallet path - bundled transactions
        const txId = await (walletClient as any).sendCalls({
          calls,
          chainId: baseSepolia.id,
        });

        console.log("Bundled repay transaction sent:", txId);
        setTxStatus("success");
        
        // Trigger refresh and close modal
        onTransactionSuccess?.();
        
        // Close modal after showing success
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        // EOA path - sequential transactions
        // First approve
        const approveTx = await (walletClient as any).sendTransaction({
          to: USDC_ADDRESS as `0x${string}`,
          data: encodeFunctionData({
            abi: USDC_ABI,
            functionName: "approve",
            args: [tokenAddress as `0x${string}`, repayAmount],
          }),
          chain: baseSepolia,
          account: address,
        });

        console.log("Approve transaction sent:", approveTx);

        // Wait for approval to be mined
        const receipt1 = await (walletClient as any).waitForTransactionReceipt({
          hash: approveTx,
        });

        // Then repay
        const repayTx = await (walletClient as any).sendTransaction({
          to: tokenAddress as `0x${string}`,
          data: encodeFunctionData({
            abi: TOKEN_ABI,
            functionName: "repay",
            args: [address as `0x${string}`, repayAmount],
          }),
          chain: baseSepolia,
          account: address,
        });

        console.log("Repay transaction sent:", repayTx);

        // Wait for repay to be mined
        const receipt2 = await (walletClient as any).waitForTransactionReceipt({
          hash: repayTx,
        });

        setTxStatus("success");
        
        // Trigger refresh
        onTransactionSuccess?.();
      }

      // Close modal after showing success for both paths
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Repay transaction failed:", error);
      setTxError(error instanceof Error ? error : new Error("Transaction failed"));
      setTxStatus("error");
    } finally {
      setIsProcessing(false);
    }
  }, [walletClient, address, inputValue, userBalance, userDebt, tokenAddress, onTransactionSuccess]);


  // Use portal to render outside of parent component hierarchy
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black z-[9999]">
      <div className="absolute inset-0 bg-black" />
      <div className="relative w-full max-w-md mx-auto h-full flex flex-col">
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="hover:opacity-80 transition-opacity disabled:opacity-50"
              style={{ color: themeColor }}
            >
              <X size={24} />
            </button>
            <div className="flex-1" />
          </div>

          <h1 className="text-white text-2xl font-semibold mb-4 text-left">
            Repay {tokenSymbol.toUpperCase()} debt
          </h1>

          <div className="space-y-4">
            <div>
              <label
                className="text-sm mb-2 block"
                style={{ color: themeColor }}
              >
                Pay
              </label>
              <div className="text-white text-3xl font-medium mb-1 tracking-wide">
                {displayValue}
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <button 
                  onClick={() => {
                    if (userDebt && parseFloat(userDebt) > 0) {
                      const debtStr = userDebt.toString();
                      setInputValue(debtStr);
                      // Format without forcing decimals
                      const parts = debtStr.split('.');
                      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                      const formattedValue = parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
                      setDisplayValue("$" + formattedValue);
                    }
                  }}
                  className="text-gray-600 hover:text-white transition-colors cursor-pointer text-left"
                >
                  {isLoadingBalance
                    ? "Loading..."
                    : `${formatCurrency(userDebt, 2, false)} debt`}
                </button>
                <button 
                  onClick={() => {
                    if (userBalance && parseFloat(userBalance) > 0) {
                      // Fill with min of balance and debt
                      const fillAmount = Math.min(parseFloat(userBalance), parseFloat(userDebt));
                      const fillStr = fillAmount.toFixed(2);
                      setInputValue(fillStr);
                      // Format without forcing decimals
                      const parts = fillStr.split('.');
                      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                      const formattedValue = parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
                      setDisplayValue("$" + formattedValue);
                    }
                  }}
                  className="text-gray-600 hover:text-white transition-colors cursor-pointer text-left"
                >
                  {isLoadingBalance
                    ? "Loading..."
                    : `${formatCurrency(userBalance, 2, false)} available`}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end pb-16">
          <div className="px-4">
            <button
              onClick={handleRepay}
              disabled={
                parseFloat(inputValue) <= 0 ||
                parseFloat(inputValue) > parseFloat(userBalance) ||
                parseFloat(inputValue) > parseFloat(userDebt) || // Prevent over-repayment
                isProcessing
              }
              className={`w-full disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-2.5 rounded-xl transition-colors mb-3 flex items-center justify-center gap-2 focus:outline-none hover:opacity-90`}
              style={{
                backgroundColor:
                  parseFloat(inputValue) <= 0 ||
                  parseFloat(inputValue) > parseFloat(userBalance) ||
                  parseFloat(inputValue) > parseFloat(userDebt) ||
                  isProcessing
                    ? "#374151" // gray when disabled
                    : txStatus === "success"
                      ? "#10b981" // green on success
                      : txStatus === "error"
                        ? "#ef4444" // red on error
                        : themeColor, // theme color when normal
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : txStatus === "success" ? (
                <>
                  <CheckCircle2 size={20} />
                  <span>Success!</span>
                </>
              ) : txStatus === "error" ? (
                <>
                  <AlertCircle size={20} />
                  <span>Try Again</span>
                </>
              ) : (
                "Repay"
              )}
            </button>

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