/**
 * Hook for handling sell token transactions with batch operations
 * Following the exact pattern from useSendCallsBuyToken which works correctly
 */

'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { parseUnits, encodeFunctionData, formatUnits, numberToHex, type Address } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { 
  ROUTER_ADDRESS, 
  ROUTER_ABI,
} from '@/lib/constants';

interface SellTokenParams {
  tokenAddress: string;
  tokenAmount: string;
  minUsdcAmountOut: bigint;
}

interface BatchTransactionStatus {
  sellStatus: 'idle' | 'pending' | 'success' | 'error';
  error?: string;
  txHash?: string;
}

/**
 * Hook for executing sell transaction
 * Uses the same pattern as buy - direct wallet_sendCalls without polling
 */
export function useSendCallsSellToken() {
  const { address: userAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [status, setStatus] = useState<BatchTransactionStatus>({
    sellStatus: 'idle',
  });
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Check if wallet supports batch transactions
   */
  const checkBatchSupport = useCallback(async () => {
    if (!walletClient || !userAddress) return false;

    try {
      const capabilities = await walletClient.request({
        method: 'wallet_getCapabilities' as any,
        params: [userAddress]
      });

      const chainCapabilities = (capabilities as any)?.[baseSepolia.id];
      return chainCapabilities?.atomicBatch?.supported === true;
    } catch (error) {
      console.log('Batch capabilities check failed, assuming supported:', error);
      return true; // Assume supported if check fails (Smart Wallet should support it)
    }
  }, [walletClient, userAddress]);

  /**
   * Execute sell transaction using wallet_sendCalls
   * This follows the EXACT pattern from buy/curate
   */
  const executeSell = useCallback(async (params: SellTokenParams) => {
    const { tokenAddress, tokenAmount, minUsdcAmountOut } = params;

    if (!userAddress) {
      setStatus(prev => ({
        ...prev,
        error: 'Please connect your wallet',
      }));
      return;
    }

    if (!walletClient) {
      setStatus(prev => ({
        ...prev,
        error: 'Wallet not connected',
      }));
      return;
    }

    try {
      setIsLoading(true);
      setStatus({
        sellStatus: 'pending',
      });

      // Parse token amount to 18 decimals (standard for tokens)
      const amountTokenIn = parseUnits(tokenAmount, 18);
      
      // Set expiry to 20 minutes from now
      const expireTimestamp = BigInt(Math.floor(Date.now() / 1000) + 1200);

      console.log('Starting sell transaction:', {
        tokenAddress,
        tokenAmount,
        minUsdcAmountOut: minUsdcAmountOut.toString(),
        userAddress,
      });

      // Check if batch transactions are supported
      const batchSupported = await checkBatchSupport();
      console.log('Batch transactions supported:', batchSupported);

      // For sell, we only need one call - the router sell function
      // The router will handle the token transfer internally
      const sellCallData = encodeFunctionData({
        abi: ROUTER_ABI,
        functionName: 'sell',
        args: [
          tokenAddress as Address,
          '0x0000000000000000000000000000000000000000' as Address, // No affiliate
          amountTokenIn,
          minUsdcAmountOut,
          expireTimestamp
        ],
      });

      // Prepare the call
      const calls = [
        {
          to: ROUTER_ADDRESS as Address,
          value: '0x0',
          data: sellCallData,
        }
      ];

      console.log('Executing sell call:', calls);

      // Send transaction using wallet_sendCalls - EXACTLY like buy/curate
      const result = await walletClient.request({
        method: 'wallet_sendCalls' as any,
        params: [{
          version: '2.0.0',
          from: userAddress,
          chainId: numberToHex(baseSepolia.id),
          atomicRequired: true, // All calls must succeed or all fail
          calls: calls
        }]
      });

      console.log('Sell transaction sent:', result);

      // Update status to success IMMEDIATELY - just like buy/curate
      setStatus({
        sellStatus: 'success',
        txHash: (result as any)?.transactionHash || result,
      });

    } catch (error: any) {
      console.error('Sell transaction failed:', error);
      
      let errorMessage = 'Sell transaction failed';
      
      if (error.code === 4001) {
        errorMessage = 'User rejected the transaction';
      } else if (error.code === 5740) {
        errorMessage = 'Batch too large for wallet to process';
      } else if (error.code === -32602) {
        errorMessage = 'Invalid request format';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setStatus({
        sellStatus: 'error',
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, userAddress, checkBatchSupport]);

  /**
   * Reset transaction state
   */
  const reset = useCallback(() => {
    setStatus({
      sellStatus: 'idle',
    });
    setIsLoading(false);
  }, []);

  // Return the same interface structure for compatibility
  return {
    executeSell,
    status: status.sellStatus === 'success' ? 'success' : 
            status.sellStatus === 'pending' ? 'confirming' :
            status.sellStatus === 'error' ? 'error' : 'idle',
    isLoading,
    isSuccess: status.sellStatus === 'success',
    error: status.error ? new Error(status.error) : undefined,
    reset,
  };
}