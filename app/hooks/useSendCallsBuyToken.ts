/**
 * Hook for handling buy token transactions with batch operations
 * Following the exact pattern from useCurateContent which works correctly
 */

'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { parseUnits, encodeFunctionData, formatUnits, numberToHex, type Address } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { 
  USDC_ADDRESS, 
  USDC_ABI, 
  ROUTER_ADDRESS, 
  ROUTER_ABI,
  USDC_DECIMALS 
} from '@/lib/constants';

interface BuyTokenParams {
  tokenAddress: string;
  usdcAmount: string;
  minTokenAmountOut: bigint;
}

interface BatchTransactionStatus {
  approveStatus: 'idle' | 'pending' | 'success' | 'error';
  buyStatus: 'idle' | 'pending' | 'success' | 'error';
  error?: string;
  txHash?: string;
}

/**
 * Hook for executing bundled approve + buy transaction
 * Uses the same pattern as useCurateContent - direct wallet_sendCalls without polling
 */
export function useSendCallsBuyToken() {
  const { address: userAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [status, setStatus] = useState<BatchTransactionStatus>({
    approveStatus: 'idle',
    buyStatus: 'idle',
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
   * Execute batch buy transaction using wallet_sendCalls
   * This follows the EXACT pattern from useCurateContent
   */
  const executeBuy = useCallback(async (params: BuyTokenParams) => {
    const { tokenAddress, usdcAmount, minTokenAmountOut } = params;

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
        approveStatus: 'pending',
        buyStatus: 'pending',
      });

      // Parse USDC amount to 6 decimals
      const amountQuoteIn = parseUnits(usdcAmount, USDC_DECIMALS);
      
      // Set expiry to 20 minutes from now
      const expireTimestamp = BigInt(Math.floor(Date.now() / 1000) + 1200);

      console.log('Starting batch transaction:', {
        tokenAddress,
        usdcAmount,
        minTokenAmountOut: minTokenAmountOut.toString(),
        userAddress,
      });

      // Check if batch transactions are supported
      const batchSupported = await checkBatchSupport();
      console.log('Batch transactions supported:', batchSupported);

      // Encode the USDC approve call
      const approveCallData = encodeFunctionData({
        abi: USDC_ABI,
        functionName: 'approve',
        args: [ROUTER_ADDRESS as Address, amountQuoteIn],
      });

      // Encode the router buy call
      const buyCallData = encodeFunctionData({
        abi: ROUTER_ABI,
        functionName: 'buy',
        args: [
          tokenAddress as Address,
          '0x0000000000000000000000000000000000000000' as Address, // No affiliate
          amountQuoteIn,
          minTokenAmountOut,
          expireTimestamp
        ],
      });

      // Prepare batch calls
      const calls = [
        {
          to: USDC_ADDRESS as Address,
          value: '0x0',
          data: approveCallData,
        },
        {
          to: ROUTER_ADDRESS as Address,
          value: '0x0',
          data: buyCallData,
        }
      ];

      console.log('Executing batch calls:', calls);

      // Send batch transaction using wallet_sendCalls - EXACTLY like useCurateContent
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

      console.log('Batch transaction sent:', result);

      // Update status to success IMMEDIATELY - just like useCurateContent
      setStatus({
        approveStatus: 'success',
        buyStatus: 'success',
        txHash: (result as any)?.transactionHash || result,
      });

    } catch (error: any) {
      console.error('Batch transaction failed:', error);
      
      let errorMessage = 'Batch transaction failed';
      
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
        approveStatus: 'error',
        buyStatus: 'error',
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
      approveStatus: 'idle',
      buyStatus: 'idle',
    });
    setIsLoading(false);
  }, []);

  // Return the same interface structure for compatibility
  return {
    executeBuy,
    status: status.approveStatus === 'success' && status.buyStatus === 'success' ? 'success' : 
            status.approveStatus === 'pending' || status.buyStatus === 'pending' ? 'confirming' :
            status.approveStatus === 'error' || status.buyStatus === 'error' ? 'error' : 'idle',
    isLoading,
    isSuccess: status.approveStatus === 'success' && status.buyStatus === 'success',
    error: status.error ? new Error(status.error) : undefined,
    callsId: status.txHash,
    reset,
  };
}